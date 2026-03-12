import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import BottomNav from '../components/BottomNav';

// -------------------------------------------------------
// RecurringExpenses – Subscriptions & Bills Tracker
// -------------------------------------------------------
// Manages recurring (monthly / weekly) expenses like
// Netflix, rent, gym etc. Users can add, toggle active,
// and delete subscriptions. Shows monthly total.
// -------------------------------------------------------

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' },
];

const CATEGORY_EMOJIS = {
  Food: '🍔', Travel: '✈️', Supplies: '📦', Entertainment: '🎬',
  Bills: '🧾', Health: '💊', Shopping: '🛍️', Other: '💰',
};

const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

function RecurringExpenses() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [frequency, setFrequency] = useState('monthly');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch recurring items
  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setItems(data || []);
      setIsLoading(false);
    }
    fetch();
  }, []);

  // Monthly cost projection
  const monthlyTotal = items
    .filter((i) => i.is_active)
    .reduce((sum, i) => {
      if (i.frequency === 'weekly') return sum + i.amount * 4.33;
      if (i.frequency === 'yearly') return sum + i.amount / 12;
      return sum + i.amount;
    }, 0);

  // Add new recurring expense
  const handleAdd = async () => {
    if (!name.trim() || !amount || Number(amount) <= 0) {
      alert('Please enter a name and valid amount.');
      return;
    }
    setIsSaving(true);
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({
        name: name.trim(),
        amount: parseFloat(amount),
        category,
        frequency,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      alert(`Failed: ${error.message}`);
    } else {
      setItems((prev) => [data, ...prev]);
      setName('');
      setAmount('');
      setCategory('Bills');
      setFrequency('monthly');
      setShowForm(false);
    }
    setIsSaving(false);
  };

  // Toggle active/paused
  const toggleActive = async (item) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
      );
    }
  };

  // Delete
  const handleDelete = async (id) => {
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-gray-950 flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-900 w-full flex items-center px-4 shadow-sm">
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-white">Subscriptions</h1>
      </header>

      <main className="flex-1 px-4 pt-20 pb-24 space-y-4">
        {/* Monthly projection card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Monthly Recurring Total
          </p>
          <p className="text-[36px] font-bold text-blue-600 dark:text-blue-400 mt-1">
            ₹{Math.round(monthlyTotal).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {items.filter((i) => i.is_active).length} active subscription{items.filter((i) => i.is_active).length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Add Button or Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full h-12 rounded-full border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 active:bg-blue-50 dark:active:bg-blue-900/20 transition-colors"
          >
            + Add Subscription
          </button>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
            <input
              type="text"
              placeholder="Name (e.g. Netflix, Rent)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-transparent border border-gray-400 dark:border-gray-600 rounded-md px-4 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:border-2 focus:outline-none transition-colors"
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              className="w-full h-12 bg-transparent border border-gray-400 dark:border-gray-600 rounded-md px-4 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:border-2 focus:outline-none transition-colors"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-12 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-md px-3 text-sm text-gray-900 dark:text-white focus:border-blue-600 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
                ))}
              </select>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="h-12 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-md px-3 text-sm text-gray-900 dark:text-white focus:border-blue-600 focus:outline-none"
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 h-11 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isSaving}
                className={`flex-1 h-11 rounded-full font-medium transition-all ${
                  isSaving
                    ? 'bg-blue-300 text-blue-100 cursor-not-allowed'
                    : 'bg-blue-600 text-white active:bg-blue-700 active:scale-[0.98]'
                }`}
              >
                {isSaving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Section heading */}
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide pt-1">
          Your Subscriptions {!isLoading && `(${items.length})`}
        </h2>

        {/* Loading */}
        {isLoading && (
          <p className="text-center text-gray-400 py-12 text-sm">Loading...</p>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-5xl mb-4">🔄</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recurring expenses yet. Track your subscriptions & bills!
            </p>
          </div>
        )}

        {/* Subscription cards */}
        {!isLoading &&
          items.map((item) => {
            const emoji = CATEGORY_EMOJIS[item.category] || '💰';
            const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === item.frequency)?.label || item.frequency;
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-900 rounded-xl border p-4 flex items-center gap-4 transition-opacity ${
                  item.is_active
                    ? 'border-gray-100 dark:border-gray-800'
                    : 'border-gray-100 dark:border-gray-800 opacity-50'
                }`}
              >
                {/* Emoji circle */}
                <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <span className="text-2xl leading-none">{emoji}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ₹{Number(item.amount).toLocaleString('en-IN')} · {freqLabel}
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleActive(item)}
                  className={`w-11 h-7 rounded-full transition-colors duration-200 relative shrink-0 ${
                    item.is_active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={item.is_active ? 'Pause subscription' : 'Activate subscription'}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 absolute top-1 ${
                      item.is_active ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-red-50 dark:active:bg-red-900/20 transition-colors shrink-0"
                  aria-label="Delete"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
      </main>

      <BottomNav />
    </div>
  );
}

export default RecurringExpenses;
