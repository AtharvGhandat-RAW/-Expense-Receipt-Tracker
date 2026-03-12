package com.expensetracker.app;

import android.Manifest;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.PermissionState;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@CapacitorPlugin(
    name = "SmsReader",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.READ_SMS }
        )
    }
)
public class SmsReaderPlugin extends Plugin {

    // Bank / payment SMS sender patterns (Indian banks & UPI apps)
    private static final List<String> BANK_SENDERS = Arrays.asList(
        "HDFCBK", "SBIINB", "SBICRD", "ICICIB", "AXISBK", "KOTAKB",
        "BOIIND", "PNBSMS", "IDFCFB", "YESBK", "INDUSB", "FEDBNK",
        "CANBNK", "UNIONB", "CENTBK", "BOBSMS",
        "PAYTM", "PHONPE", "GPAY", "AMAZONP", "MOBIKWIK",
        "JIOPAY", "CREDCL", "SLICE", "LAZYPAY", "SIMPL",
        "RBLBNK", "AUBANK", "SCBANK"
    );

    // Debit-related keywords
    private static final Pattern DEBIT_PATTERN = Pattern.compile(
        "(?i)(debited|debit|spent|paid|purchase|payment|transferred|sent|withdrawn|txn|transaction|charged)"
    );

    @PluginMethod
    public void getSmsList(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestAllPermissions(call, "smsPermsCallback");
            return;
        }

        readSms(call);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState("sms") == PermissionState.GRANTED);
        call.resolve(result);
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            readSms(call);
        } else {
            call.reject("SMS permission denied");
        }
    }

    private void readSms(PluginCall call) {
        int daysBack = call.getInt("daysBack", 30);
        long since = System.currentTimeMillis() - ((long) daysBack * 24 * 60 * 60 * 1000);

        JSArray messages = new JSArray();

        try {
            Uri uri = Telephony.Sms.Inbox.CONTENT_URI;
            String[] projection = { "address", "body", "date" };
            String selection = "date > ?";
            String[] selectionArgs = { String.valueOf(since) };
            String sortOrder = "date DESC";

            Cursor cursor = getContext().getContentResolver().query(
                uri, projection, selection, selectionArgs, sortOrder
            );

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String address = cursor.getString(0);
                    String body = cursor.getString(1);
                    long date = cursor.getLong(2);

                    if (address == null || body == null) continue;

                    String upperAddr = address.toUpperCase();
                    boolean isBankSms = false;
                    for (String sender : BANK_SENDERS) {
                        if (upperAddr.contains(sender)) {
                            isBankSms = true;
                            break;
                        }
                    }

                    if (!isBankSms) continue;
                    if (!DEBIT_PATTERN.matcher(body).find()) continue;

                    JSObject sms = new JSObject();
                    sms.put("address", address);
                    sms.put("body", body);
                    sms.put("date", date);
                    messages.put(sms);
                }
                cursor.close();
            }
        } catch (Exception e) {
            call.reject("Failed to read SMS: " + e.getMessage());
            return;
        }

        JSObject result = new JSObject();
        result.put("messages", messages);
        call.resolve(result);
    }
}
