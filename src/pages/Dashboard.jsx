import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import BottomNav from '../components/BottomNav';

// -------------------------------------------------------
// Dashboard – Home Screen (Material Design 3)
// -------------------------------------------------------

const CATEGORY_META = {
  Food:          { emoji: '🍔', color: 'bg-orange-50 dark:bg-orange-900/20' },
  Travel:        { emoji: '✈️', color: 'bg-sky-50 dark:bg-sky-900/20' },
  Supplies:      { emoji: '📦', color: 'bg-amber-50 dark:bg-amber-900/20' },
  Entertainment: { emoji: '🎬', color: 'bg-purple-50 dark:bg-purple-900/20' },
  Bills:         { emoji: '🧾', color: 'bg-red-50 dark:bg-red-900/20' },
  Health:        { emoji: '💊', color: 'bg-green-50 dark:bg-green-900/20' },
  Shopping:      { emoji: '🛍️', color: 'bg-pink-50 dark:bg-pink-900/20' },
  Other:         { emoji: '💰', color: 'bg-gray-50 dark:bg-gray-800/40' },
};

const ALL_CATEGORIES = ['All', ...Object.keys(CATEGORY_META)];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function Dashboard({ darkMode, monthlyBudget }) {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Fetch + real-time
  useEffect(() => {
    async function fetchExpenses() {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
      } else {
        setExpenses(data);
      }
      setIsLoading(false);
    }

    fetchExpenses();

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setExpenses((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setExpenses((prev) => prev.filter((e) => e.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setExpenses((prev) =>
              prev.map((e) => (e.id === payload.new.id ? payload.new : e))
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Filtered list
  const filtered = expenses.filter((exp) => {
    const matchCat = activeFilter === 'All' || exp.category === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (exp.notes || '').toLowerCase().includes(q) ||
      (exp.category || '').toLowerCase().includes(q) ||
      String(exp.amount).includes(q);
    return matchCat && matchSearch;
  });

  // Recalculate total (all expenses, not filtered)
  useEffect(() => {
    setTotalSpend(expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0));
  }, [expenses]);

  const budgetPercent = monthlyBudget > 0 ? Math.min((totalSpend / monthlyBudget) * 100, 100) : 0;
  const budgetWarning = monthlyBudget > 0 && totalSpend >= monthlyBudget * 0.8;
  const budgetExceeded = monthlyBudget > 0 && totalSpend >= monthlyBudget;

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-gray-950 flex flex-col">
      {/* ── M3 Top App Bar ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-900 w-full flex items-center px-4 shadow-sm">
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-white">Expense Tracker</h1>
      </header>

      {/* ── Main Content ───────────────────────────── */}
      <main className="flex-1 px-4 pt-20 pb-24 space-y-4">
        {/* Total Spend Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Total Monthly Spend
          </p>
          <p className={`text-[36px] font-bold mt-1 ${budgetExceeded ? 'text-red-500' : 'text-blue-600'}`}>
            ₹{totalSpend.toLocaleString('en-IN')}
          </p>

          {/* Budget progress bar */}
          {monthlyBudget > 0 && (
            <div className="mt-3">
              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetExceeded ? 'bg-red-500' : budgetWarning ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <p className={`text-xs mt-1.5 ${budgetExceeded ? 'text-red-500 font-semibold' : budgetWarning ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                {budgetExceeded
                  ? `⚠️ Budget exceeded by ₹${(totalSpend - monthlyBudget).toLocaleString('en-IN')}`
                  : `₹${(monthlyBudget - totalSpend).toLocaleString('en-IN')} remaining of ₹${monthlyBudget.toLocaleString('en-IN')}`}
              </p>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`shrink-0 h-8 px-4 rounded-full text-sm font-medium transition-colors ${
                activeFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {cat !== 'All' && `${CATEGORY_META[cat]?.emoji || ''} `}{cat}
            </button>
          ))}
        </div>

        {/* Section Title */}
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide pt-1">
          {activeFilter === 'All' ? 'Recent Expenses' : activeFilter}
          {!isLoading && ` (${filtered.length})`}
        </h2>

        {/* Loading */}
        {isLoading && (
          <p className="text-center text-gray-400 py-12 text-sm">Loading...</p>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-5xl mb-4">{searchQuery ? '🔍' : '🧾'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'No matching expenses found.'
                : <>No expenses logged yet. Tap <span className="font-semibold text-blue-600">+</span> to start!</>
              }
            </p>
          </div>
        )}

        {/* Expense Cards */}
        {!isLoading && filtered.length > 0 && (
          <div>
            {filtered.map((exp) => {
              const meta = CATEGORY_META[exp.category] || CATEGORY_META.Other;
              return (
                <div
                  key={exp.id}
                  onClick={() => navigate(`/expense/${exp.id}`)}
                  className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-800 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className={`w-11 h-11 rounded-full ${meta.color} flex items-center justify-center shrink-0`}>
                    <span className="text-2xl leading-none">{meta.emoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      ₹{Number(exp.amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {exp.category} · {formatDate(exp.date)}
                    </p>
                    {exp.notes && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 truncate mt-0.5">{exp.notes}</p>
                    )}
                  </div>

                  {exp.receipt_image_url && (
                    <img
                      src={exp.receipt_image_url}
                      alt="Receipt"
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                    />
                  )}

                  {/* Chevron right */}
                  <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── M3 FAB ─────────────────────────────────── */}
      <button
        onClick={() => navigate('/add')}
        className="fixed bottom-20 right-6 bg-blue-600 text-white w-14 h-14
                   rounded-[16px] text-3xl shadow-lg shadow-blue-500/30
                   flex items-center justify-center
                   active:bg-blue-700 active:scale-95 transition-all z-50"
        aria-label="Add expense"
      >
        +
      </button>

      <BottomNav />
    </div>
  );
}

export default Dashboard;
