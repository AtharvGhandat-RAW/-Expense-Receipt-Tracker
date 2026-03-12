import { registerPlugin } from '@capacitor/core';

const SmsReader = registerPlugin('SmsReader');

// -------------------------------------------------------
// SMS Parser – Extracts transactions from bank SMS
// -------------------------------------------------------

// Regex patterns to extract amount from Indian bank SMS
const AMOUNT_PATTERNS = [
  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /(?:debited|debit|spent|paid|purchase|withdrawn|transferred|sent)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)\s*(?:debited|debit|spent)/i,
  /txn\s+of\s+(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /payment\s+of\s+(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
];

// Regex patterns to extract merchant/receiver name
const MERCHANT_PATTERNS = [
  /(?:to|at|towards|for|@)\s+([A-Za-z0-9][\w\s&'.,-]{1,40}?)(?:\s+(?:on|ref|upi|via|txn|credited|a\/c|ac\b|$))/i,
  /(?:vpa|upi)\s*[-:]?\s*([a-zA-Z0-9._-]+@[a-zA-Z]+)/i,
  /(?:info|ref)[-:\s]+([A-Za-z][\w\s&'.,-]{1,30})/i,
];

// Merchant keyword → Category mapping
const MERCHANT_CATEGORY_MAP = {
  // Food & Dining
  Food: [
    'swiggy', 'zomato', 'dominos', 'mcdonald', 'subway', 'pizza', 'hut',
    'burger', 'kfc', 'starbucks', 'café', 'cafe', 'restaurant', 'food',
    'biryani', 'kitchen', 'dhaba', 'chai', 'tea', 'bakery', 'mess',
    'canteen', 'eatery', 'dine', 'baskin', 'haldiram', 'barbeque',
    'dunkin', 'chaayos', 'behrouz', 'faasos', 'box8', 'freshmen',
  ],
  // Travel & Transport
  Travel: [
    'ola', 'uber', 'rapido', 'irctc', 'railway', 'petrol', 'fuel',
    'hp ', 'bpcl', 'iocl', 'shell', 'parking', 'fastag', 'metro',
    'bus', 'auto', 'cab', 'flight', 'indigo', 'spicejet', 'vistara',
    'makemytrip', 'goibibo', 'redbus', 'yatra', 'cleartrip', 'namma',
  ],
  // Entertainment
  Entertainment: [
    'netflix', 'hotstar', 'disney', 'prime', 'amazon prime', 'pvr',
    'inox', 'bookmyshow', 'spotify', 'youtube', 'jiocinema', 'zee5',
    'sonyliv', 'gaana', 'wynk', 'game', 'gaming', 'xbox', 'playstation',
    'cinema', 'movie', 'concert',
  ],
  // Shopping
  Shopping: [
    'amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'nykaa', 'tata',
    'reliance', 'dmart', 'bigbasket', 'blinkit', 'zepto', 'instamart',
    'jiomart', 'grofers', 'dunzo', 'mall', 'mart', 'store', 'shop',
    'croma', 'vijay', 'decathlon', 'zudio', 'shoppers', 'lifestyle',
    'westside', 'pantaloons', 'max ', 'trend', 'fashion',
  ],
  // Bills & Utilities
  Bills: [
    'airtel', 'jio', 'vodafone', 'vi ', 'bsnl', 'electricity',
    'bescom', 'water', 'gas', 'broadband', 'wifi', 'rent', 'emi',
    'loan', 'insurance', 'premium', 'postpaid', 'prepaid', 'recharge',
    'dth', 'tata sky', 'dish tv', 'maintenance', 'society',
  ],
  // Health & Medical
  Health: [
    'apollo', 'practo', 'pharmeasy', 'netmeds', 'medplus', 'pharmacy',
    'medical', 'hospital', 'clinic', 'doctor', 'lab', 'diagnostic',
    'health', 'dental', 'eye', 'optical', 'wellness', 'gym', 'cult',
    'fit', 'yoga',
  ],
  // Supplies & Office
  Supplies: [
    'stationary', 'stationery', 'office', 'supply', 'printer', 'ink',
    'paper', 'pen', 'notebook', 'hardware',
  ],
};

/**
 * Parse a single bank SMS to extract transaction details
 */
function parseSms(smsBody, smsDate) {
  let amount = null;

  // Try each amount pattern
  for (const pattern of AMOUNT_PATTERNS) {
    const match = smsBody.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0 && amount < 10000000) break; // sanity check
      amount = null;
    }
  }

  if (!amount || amount <= 0) return null;

  // Extract merchant
  let merchant = 'Unknown';
  for (const pattern of MERCHANT_PATTERNS) {
    const match = smsBody.match(pattern);
    if (match) {
      merchant = match[1].trim().replace(/\s+/g, ' ');
      // Clean up common suffixes
      merchant = merchant.replace(/\s*(on|ref|upi|via|txn|$)/i, '').trim();
      if (merchant.length > 2) break;
      merchant = 'Unknown';
    }
  }

  // Also try to get UPI ID as merchant fallback
  if (merchant === 'Unknown') {
    const upiMatch = smsBody.match(/([a-zA-Z0-9._-]+@[a-zA-Z]+)/);
    if (upiMatch) {
      merchant = upiMatch[1].split('@')[0].replace(/[._-]/g, ' ').trim();
    }
  }

  // Auto-categorize
  const category = guessCategory(merchant + ' ' + smsBody);

  return {
    amount,
    merchant: merchant.slice(0, 50),
    category,
    date: new Date(smsDate).toISOString(),
    rawSms: smsBody,
  };
}

/**
 * Guess category from merchant name + SMS body using keyword matching
 */
function guessCategory(text) {
  const lower = text.toLowerCase();

  // Check user's custom mappings first (from localStorage)
  const customMap = getCustomMappings();
  for (const [keyword, cat] of Object.entries(customMap)) {
    if (lower.includes(keyword.toLowerCase())) return cat;
  }

  // Check built-in keyword map
  for (const [category, keywords] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) return category;
    }
  }

  return 'Other';
}

/**
 * Get user's custom merchant→category mappings from localStorage
 */
function getCustomMappings() {
  try {
    return JSON.parse(localStorage.getItem('merchant_category_map') || '{}');
  } catch {
    return {};
  }
}

/**
 * Learn a new merchant→category mapping (called when user corrects a category)
 */
export function learnCategory(merchant, category) {
  const map = getCustomMappings();
  const key = merchant.toLowerCase().trim();
  if (key.length > 1) {
    map[key] = category;
    localStorage.setItem('merchant_category_map', JSON.stringify(map));
  }
}

/**
 * Read bank SMS and return parsed transactions
 * @param {number} daysBack - How many days of SMS to read
 * @returns {Array} Parsed transaction objects
 */
export async function fetchSmsTransactions(daysBack = 30) {
  try {
    const result = await SmsReader.getSmsList({ daysBack });
    const messages = result.messages || [];
    const transactions = [];

    for (const sms of messages) {
      const parsed = parseSms(sms.body, sms.date);
      if (parsed) {
        // Generate a unique ID from SMS content to prevent duplicates
        parsed.smsId = `sms_${sms.date}_${parsed.amount}`;
        transactions.push(parsed);
      }
    }

    return transactions;
  } catch (error) {
    console.error('SMS fetch failed:', error);
    // Return empty array on web/non-android platforms
    return [];
  }
}

/**
 * Get pending (unreviewed) transactions from localStorage queue
 */
export function getPendingTransactions() {
  try {
    return JSON.parse(localStorage.getItem('pending_transactions') || '[]');
  } catch {
    return [];
  }
}

/**
 * Save pending transactions to localStorage queue
 */
export function savePendingTransactions(transactions) {
  localStorage.setItem('pending_transactions', JSON.stringify(transactions));
}

/**
 * Get already-processed SMS IDs to avoid duplicates
 */
function getProcessedIds() {
  try {
    return JSON.parse(localStorage.getItem('processed_sms_ids') || '[]');
  } catch {
    return [];
  }
}

/**
 * Mark SMS IDs as processed
 */
function markAsProcessed(ids) {
  const existing = getProcessedIds();
  const merged = [...new Set([...existing, ...ids])];
  // Keep only last 500 to prevent localStorage bloat
  const trimmed = merged.slice(-500);
  localStorage.setItem('processed_sms_ids', JSON.stringify(trimmed));
}

/**
 * Scan SMS and add new transactions to the pending queue
 * Returns the count of NEW transactions found
 */
export async function scanForNewTransactions(daysBack = 7) {
  const allTransactions = await fetchSmsTransactions(daysBack);
  const processedIds = getProcessedIds();
  const pending = getPendingTransactions();
  const pendingIds = new Set(pending.map((t) => t.smsId));

  const newTransactions = allTransactions.filter(
    (t) => !processedIds.includes(t.smsId) && !pendingIds.has(t.smsId)
  );

  if (newTransactions.length > 0) {
    savePendingTransactions([...newTransactions, ...pending]);
  }

  return newTransactions.length;
}

/**
 * Approve a pending transaction (remove from queue, mark processed)
 */
export function approveTransaction(smsId) {
  const pending = getPendingTransactions();
  const approved = pending.find((t) => t.smsId === smsId);
  const remaining = pending.filter((t) => t.smsId !== smsId);
  savePendingTransactions(remaining);
  if (approved) {
    markAsProcessed([smsId]);
  }
  return approved;
}

/**
 * Dismiss (reject) a pending transaction
 */
export function dismissTransaction(smsId) {
  const pending = getPendingTransactions();
  const remaining = pending.filter((t) => t.smsId !== smsId);
  savePendingTransactions(remaining);
  markAsProcessed([smsId]);
}
