import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import PageTransition from '../components/PageTransition';

// -------------------------------------------------------
// ExpenseDetail – View / Edit / Delete an expense
// -------------------------------------------------------
// Accessed by tapping an expense card. Shows full details,
// allows inline editing, and provides a delete option.
// -------------------------------------------------------

const CATEGORIES = ['Food', 'Travel', 'Supplies', 'Entertainment', 'Bills', 'Health', 'Shopping', 'Other'];

function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expense, setExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch the single expense row by ID
  useEffect(() => {
    async function fetchExpense() {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching expense:', error);
      } else {
        setExpense(data);
        setAmount(String(data.amount));
        setCategory(data.category);
        setNotes(data.notes || '');
      }
      setIsLoading(false);
    }
    fetchExpense();
  }, [id]);

  // Save edits
  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('expenses')
      .update({
        amount: parseFloat(amount),
        category,
        notes,
      })
      .eq('id', id);

    if (error) {
      alert(`Update failed: ${error.message}`);
    } else {
      setExpense({ ...expense, amount: parseFloat(amount), category, notes });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  // Delete expense
  const handleDelete = async () => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      alert(`Delete failed: ${error.message}`);
    } else {
      navigate('/');
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  if (isLoading) {
    return (
      <div className="h-full bg-[#F4F4F5] dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="h-full bg-[#F4F4F5] dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Expense not found.</p>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="h-full bg-[#F4F4F5] dark:bg-gray-950 flex flex-col">
      {/* Top App Bar */}
      <header className="h-16 bg-white dark:bg-gray-900 w-full flex items-center px-4 shadow-sm gap-3 shrink-0 z-10">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-white flex-1">Expense Detail</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 dark:text-blue-400 text-sm font-medium px-3 py-1 rounded-full active:bg-blue-50 dark:active:bg-blue-900/30 transition-colors"
          >
            Edit
          </button>
        )}
      </header>

      <main className="flex-1 native-scroll px-4 pt-4 pb-24 space-y-4">
        {/* Amount Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 text-center"
        >
          {isEditing ? (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-[36px] font-bold text-blue-600 dark:text-blue-400 bg-transparent text-center w-full border-b-2 border-blue-600 focus:outline-none"
            />
          ) : (
            <p className="text-[36px] font-bold text-blue-600 dark:text-blue-400">
              ₹{Number(expense.amount).toLocaleString('en-IN')}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(expense.date)}</p>
        </motion.div>

        {/* Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-4"
        >
          {/* Category */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Category</p>
            {isEditing ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-md px-4 text-base text-gray-900 dark:text-white focus:border-blue-600 focus:border-2 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <p className="text-base font-medium text-gray-900 dark:text-white">{expense.category}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            {isEditing ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-md px-4 py-3 text-base text-gray-900 dark:text-white focus:border-blue-600 focus:border-2 focus:outline-none resize-none"
              />
            ) : (
              <p className="text-base text-gray-700 dark:text-gray-300">
                {expense.notes || 'No notes added.'}
              </p>
            )}
          </div>
        </motion.div>

        {/* Receipt Image */}
        {expense.receipt_image_url && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Receipt</p>
            <img
              src={expense.receipt_image_url}
              alt="Receipt"
              className="w-full max-h-72 object-contain rounded-xl"
            />
          </div>
        )}

        {/* Edit mode: Save / Cancel buttons */}
        {isEditing && (
          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full h-12 rounded-full font-medium shadow-md transition-all ${
                isSaving
                  ? 'bg-blue-300 text-blue-100 cursor-not-allowed'
                  : 'bg-blue-600 text-white active:bg-blue-700 active:scale-[0.98]'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setAmount(String(expense.amount));
                setCategory(expense.category);
                setNotes(expense.notes || '');
              }}
              className="w-full h-12 rounded-full text-gray-500 dark:text-gray-400 font-medium active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Delete Button */}
        {!isEditing && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full h-12 rounded-full border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 font-medium active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
          >
            Delete Expense
          </button>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/40 flex items-end justify-center p-4"
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 space-y-4 mb-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete this expense?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. The expense and any associated receipt will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-11 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-11 rounded-full bg-red-500 text-white font-medium active:bg-red-600 active:scale-[0.98] transition-all"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
}

export default ExpenseDetail;
