import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import BottomNav from '../components/BottomNav';

// -------------------------------------------------------
// Analytics – Spending breakdown & insights
// -------------------------------------------------------
// Shows: category breakdown bars, top spending category,
// daily average, total transactions count, and a monthly
// spending timeline.
// -------------------------------------------------------

// All available categories with colors and emojis
const CATEGORY_META = {
  Food:           { color: 'bg-orange-500', emoji: '🍔' },
  Travel:         { color: 'bg-blue-500',   emoji: '✈️' },
  Supplies:       { color: 'bg-green-500',  emoji: '📦' },
  Entertainment:  { color: 'bg-purple-500', emoji: '🎬' },
  Bills:          { color: 'bg-red-500',    emoji: '🧾' },
  Health:         { color: 'bg-pink-500',   emoji: '💊' },
  Shopping:       { color: 'bg-yellow-500', emoji: '🛍️' },
  Other:          { color: 'bg-gray-500',   emoji: '💰' },
};

function Analytics() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) console.error(error);
      else setExpenses(data);
      setIsLoading(false);
    }
    fetchAll();
  }, []);

  // --- Derived stats ---
  const totalSpend = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalCount = expenses.length;

  // Category breakdown: { Food: 1200, Travel: 800, ... }
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
    return acc;
  }, {});

  const maxCategoryAmount = Math.max(...Object.values(categoryTotals), 1);

  // Top category
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  // Daily average (based on unique days)
  const uniqueDays = new Set(expenses.map((e) => e.date?.slice(0, 10))).size || 1;
  const dailyAvg = totalSpend / uniqueDays;

  // Last 7 days timeline
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayTotal = expenses
      .filter((e) => e.date?.slice(0, 10) === key)
      .reduce((s, e) => s + (e.amount || 0), 0);
    last7.push({ key, label, amount: dayTotal });
  }
  const maxDay = Math.max(...last7.map((d) => d.amount), 1);

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-gray-950 flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-900 w-full flex items-center px-4 shadow-sm">
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-white">Analytics</h1>
      </header>

      <main className="flex-1 px-4 pt-20 pb-24 space-y-4">
        {isLoading ? (
          <p className="text-center text-gray-400 py-12 text-sm">Loading...</p>
        ) : expenses.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No data yet. Add some expenses to see your analytics!
            </p>
          </div>
        ) : (
          <>
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{totalSpend.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Daily Avg</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{Math.round(dailyAvg).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Entries</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalCount}</p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Spending by Category
              </h3>
              <div className="space-y-3">
                {Object.entries(categoryTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
                    const pct = (amount / maxCategoryAmount) * 100;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {meta.emoji} {cat}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ₹{amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${meta.color} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 7-Day Timeline */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Last 7 Days
              </h3>
              <div className="flex items-end justify-between gap-2 h-32">
                {last7.map((day) => {
                  const heightPct = day.amount > 0 ? (day.amount / maxDay) * 100 : 4;
                  return (
                    <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        {day.amount > 0 ? `₹${Math.round(day.amount)}` : ''}
                      </span>
                      <div className="w-full flex items-end" style={{ height: '80px' }}>
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            day.amount > 0 ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Category Insight */}
            {topCategory && (
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 flex items-center gap-3">
                <span className="text-3xl">{(CATEGORY_META[topCategory[0]] || CATEGORY_META.Other).emoji}</span>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Top spending: {topCategory[0]}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    ₹{topCategory[1].toLocaleString('en-IN')} ({Math.round((topCategory[1] / totalSpend) * 100)}% of total)
                  </p>
                </div>
              </div>
            )}

            {/* Monthly Report link */}
            <button
              onClick={() => navigate('/report')}
              className="w-full h-12 rounded-full border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center gap-2 active:bg-blue-50 dark:active:bg-blue-900/20 transition-colors"
            >
              📅 View Monthly Report
            </button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default Analytics;
