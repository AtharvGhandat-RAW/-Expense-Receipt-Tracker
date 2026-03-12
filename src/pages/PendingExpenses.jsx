import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import {
  scanForNewTransactions,
  getPendingTransactions,
  savePendingTransactions,
  approveTransaction,
  dismissTransaction,
  learnCategory,
} from '../services/smsParser';
import BottomNav from '../components/BottomNav';
import PageTransition from '../components/PageTransition';

// -------------------------------------------------------
// PendingExpenses – SMS Transaction Queue (M3 Style)
// -------------------------------------------------------
// Shows auto-detected transactions from bank SMS.
// Red-highlighted = pending review. User edits category
// and approves each item to save to Supabase.
// -------------------------------------------------------

const CATEGORIES = [
  { value: 'Food', emoji: '🍔' },
  { value: 'Travel', emoji: '✈️' },
  { value: 'Supplies', emoji: '📦' },
  { value: 'Entertainment', emoji: '🎬' },
  { value: 'Bills', emoji: '🧾' },
  { value: 'Health', emoji: '💊' },
  { value: 'Shopping', emoji: '🛍️' },
  { value: 'Other', emoji: '💰' },
];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PendingExpenses({ darkMode }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [showSmsDetail, setShowSmsDetail] = useState(null);

  // Load pending transactions from localStorage
  const loadPending = useCallback(() => {
    setPending(getPendingTransactions());
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // Scan for new SMS transactions
  const handleScan = async () => {
    setScanning(true);
    try {
      const newCount = await scanForNewTransactions(7);
      loadPending();
      if (newCount === 0) {
        // No new transactions — short visual feedback
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
    setScanning(false);
  };

  // Update category for a pending item
  const updateCategory = (smsId, newCategory) => {
    const updated = pending.map((t) =>
      t.smsId === smsId ? { ...t, category: newCategory } : t
    );
    setPending(updated);
    savePendingTransactions(updated);

    // Learn this merchant→category for future auto-categorization
    const item = updated.find((t) => t.smsId === smsId);
    if (item && item.merchant && item.merchant !== 'Unknown') {
      learnCategory(item.merchant, newCategory);
    }
  };

  // Update amount for a pending item
  const updateAmount = (smsId, newAmount) => {
    const amt = parseFloat(newAmount) || 0;
    const updated = pending.map((t) =>
      t.smsId === smsId ? { ...t, amount: amt } : t
    );
    setPending(updated);
    savePendingTransactions(updated);
  };

  // Approve & save to Supabase
  const handleApprove = async (smsId) => {
    setSavingId(smsId);
    const item = approveTransaction(smsId);
    if (item) {
      const { error } = await supabase.from('expenses').insert({
        amount: item.amount,
        category: item.category,
        notes: `Auto: ${item.merchant}`,
        date: item.date.split('T')[0],
      });
      if (error) {
        console.error('Save error:', error);
        // Put it back in pending
        const current = getPendingTransactions();
        savePendingTransactions([item, ...current]);
      }
    }
    setSavingId(null);
    loadPending();
  };

  // Dismiss (ignore) a transaction
  const handleDismiss = (smsId) => {
    dismissTransaction(smsId);
    loadPending();
  };

  // Approve all pending
  const handleApproveAll = async () => {
    setScanning(true);
    for (const item of pending) {
      const approved = approveTransaction(item.smsId);
      if (approved) {
        await supabase.from('expenses').insert({
          amount: approved.amount,
          category: approved.category,
          notes: `Auto: ${approved.merchant}`,
          date: approved.date.split('T')[0],
        });
      }
    }
    setScanning(false);
    loadPending();
  };

  return (
    <PageTransition>
      <div className="h-full bg-[#F4F4F5] dark:bg-gray-950 flex flex-col">
        {/* ── Header ───────────────────────────────── */}
        <header className="h-16 bg-white dark:bg-gray-900 w-full flex items-center px-4 shadow-sm shrink-0 z-10">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => navigate('/')}
            className="mr-3 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <h1 className="text-[22px] font-medium text-gray-900 dark:text-white">SMS Queue</h1>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            {pending.length} pending
          </span>
        </header>

        {/* ── Main Content ─────────────────────────── */}
        <main className="flex-1 native-scroll px-4 pt-4 pb-24 space-y-4">
          {/* Scan Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleScan}
            disabled={scanning}
            className="w-full h-12 rounded-xl bg-blue-600 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {scanning ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="inline-block"
                >⏳</motion.span>
                Scanning SMS...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scan SMS for Transactions
              </>
            )}
          </motion.button>

          {/* Approve All button (when there are pending items) */}
          <AnimatePresence>
            {pending.length > 1 && (
              <motion.button
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleApproveAll}
                disabled={scanning}
                className="w-full h-10 rounded-xl bg-emerald-600 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                ✓ Approve All ({pending.length})
              </motion.button>
            )}
          </AnimatePresence>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-3 flex items-start gap-3"
          >
            <span className="text-xl shrink-0 mt-0.5">📱</span>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              Transactions detected from your bank SMS are shown below with{' '}
              <span className="font-bold text-red-600 dark:text-red-400">red highlighting</span>.
              Review each item, set the correct category, then approve to add to your expenses.
            </p>
          </motion.div>

          {/* Empty State */}
          {pending.length === 0 && !scanning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center"
            >
              <p className="text-5xl mb-4">✅</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No pending transactions. Tap "Scan SMS" to detect new expenses from your bank messages.
              </p>
            </motion.div>
          )}

          {/* Pending Transaction Cards */}
          <AnimatePresence>
            {pending.map((txn, index) => {
              const catMeta = CATEGORIES.find((c) => c.value === txn.category) || CATEGORIES[7];
              const isEditing = editingId === txn.smsId;
              const isSaving = savingId === txn.smsId;

              return (
                <motion.div
                  key={txn.smsId}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -200 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
                  layout
                  className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border-2 border-red-300 dark:border-red-700/60 shadow-sm"
                >
                  {/* Red top accent bar */}
                  <div className="h-1 bg-gradient-to-r from-red-500 to-red-400" />

                  <div className="p-4">
                    {/* Top Row: Amount + Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                          <span className="text-2xl">{catMeta.emoji}</span>
                        </div>
                        <div>
                          {isEditing ? (
                            <input
                              type="number"
                              value={txn.amount}
                              onChange={(e) => updateAmount(txn.smsId, e.target.value)}
                              className="w-28 h-8 text-lg font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-lg px-2 border border-gray-300 dark:border-gray-600"
                            />
                          ) : (
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              ₹{Number(txn.amount).toLocaleString('en-IN')}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {txn.merchant}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                        Pending
                      </span>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                      {formatDate(txn.date)}
                    </p>

                    {/* Category Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {CATEGORIES.map((cat) => (
                        <motion.button
                          key={cat.value}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateCategory(txn.smsId, cat.value)}
                          className={`h-7 px-3 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                            txn.category === cat.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <span>{cat.emoji}</span> {cat.value}
                        </motion.button>
                      ))}
                    </div>

                    {/* View raw SMS toggle */}
                    <button
                      onClick={() => setShowSmsDetail(showSmsDetail === txn.smsId ? null : txn.smsId)}
                      className="text-xs text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {showSmsDetail === txn.smsId ? 'Hide' : 'View'} original SMS
                    </button>

                    <AnimatePresence>
                      {showSmsDetail === txn.smsId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden"
                        >
                          <p className="text-xs text-gray-600 dark:text-gray-400 break-all leading-relaxed font-mono">
                            {txn.rawSms}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingId(isEditing ? null : txn.smsId)}
                        className="flex-1 h-9 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {isEditing ? 'Done' : 'Edit'}
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDismiss(txn.smsId)}
                        className="h-9 px-4 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-red-500 flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Dismiss
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleApprove(txn.smsId)}
                        disabled={isSaving}
                        className="flex-1 h-9 rounded-lg text-xs font-medium bg-emerald-600 text-white flex items-center justify-center gap-1 disabled:opacity-60"
                      >
                        {isSaving ? (
                          '...'
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </main>

        <BottomNav />
      </div>
    </PageTransition>
  );
}

export default PendingExpenses;
