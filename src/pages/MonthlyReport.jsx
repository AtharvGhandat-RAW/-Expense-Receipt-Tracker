import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import PageTransition from '../components/PageTransition';

// -------------------------------------------------------
// MonthlyReport – Month-by-month spending breakdown
// -------------------------------------------------------
// Swipeable month selector, category pie visual, comparison
// with previous month, and per-category drill-down.
// -------------------------------------------------------

const CATEGORY_META = {
  Food:          { color: '#f97316', emoji: '🍔' },
  Travel:        { color: '#3b82f6', emoji: '✈️' },
  Supplies:      { color: '#22c55e', emoji: '📦' },
  Entertainment: { color: '#a855f7', emoji: '🎬' },
  Bills:         { color: '#ef4444', emoji: '🧾' },
  Health:        { color: '#ec4899', emoji: '💊' },
  Shopping:      { color: '#eab308', emoji: '🛍️' },
  Other:         { color: '#6b7280', emoji: '💰' },
};

function MonthlyReport() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Month offset: 0 = current month, -1 = last month, etc.
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      if (error) console.error(error);
      else setExpenses(data || []);
      setIsLoading(false);
    }
    fetch();
  }, []);

  // Compute the selected month's date range
  const now = new Date();
  const selectedMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthLabel = selectedMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const monthKey = selectedMonth.toISOString().slice(0, 7); // "2026-03"

  // Previous month for comparison
  const prevMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
  const prevMonthKey = prevMonth.toISOString().slice(0, 7);

  // Filter expenses for the selected and previous months
  const thisMonthExpenses = expenses.filter((e) => e.date?.slice(0, 7) === monthKey);
  const prevMonthExpenses = expenses.filter((e) => e.date?.slice(0, 7) === prevMonthKey);

  const thisTotal = thisMonthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const prevTotal = prevMonthExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  // Change percentage
  const changePct = prevTotal > 0 ? ((thisTotal - prevTotal) / prevTotal) * 100 : 0;

  // Category breakdown for selected month
  const catBreakdown = thisMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const catSorted = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);

  // Donut chart segments (SVG-based)
  const donutSegments = [];
  let cumulativePct = 0;
  catSorted.forEach(([cat, amt]) => {
    const pct = thisTotal > 0 ? (amt / thisTotal) * 100 : 0;
    donutSegments.push({
      category: cat,
      amount: amt,
      pct,
      offset: cumulativePct,
      color: CATEGORY_META[cat]?.color || '#6b7280',
    });
    cumulativePct += pct;
  });

  // Daily spending for the month
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const dailyAvg = thisMonthExpenses.length > 0 ? thisTotal / daysInMonth : 0;

  // Top 3 biggest single expenses
  const topExpenses = [...thisMonthExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <PageTransition>
    <div className="h-full bg-[#F4F4F5] dark:bg-gray-950 flex flex-col">
      {/* Top App Bar */}
      <header className="h-16 bg-white dark:bg-gray-900 w-full flex items-center px-4 shadow-sm gap-3 shrink-0 z-10">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-white">Monthly Report</h1>
      </header>

      <main className="flex-1 native-scroll px-4 pt-4 pb-10 space-y-4">
        {/* Month Selector */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{monthLabel}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {thisMonthExpenses.length} transaction{thisMonthExpenses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
            disabled={monthOffset >= 0}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              monthOffset >= 0 ? 'opacity-30' : 'active:bg-gray-100 dark:active:bg-gray-800'
            }`}
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-400 py-12 text-sm">Loading...</p>
        ) : thisMonthExpenses.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-5xl mb-4">📅</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">No expenses in {monthLabel}.</p>
          </div>
        ) : (
          <>
            {/* Total + comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 text-center"
            >
              <p className="text-[36px] font-bold text-blue-600 dark:text-blue-400">
                ₹{thisTotal.toLocaleString('en-IN')}
              </p>
              {prevTotal > 0 && (
                <p className={`text-sm mt-1 font-medium ${changePct > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {changePct > 0 ? '↑' : '↓'} {Math.abs(changePct).toFixed(1)}% vs {prevMonth.toLocaleDateString('en-IN', { month: 'short' })}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Daily avg: ₹{Math.round(dailyAvg).toLocaleString('en-IN')}
              </p>
            </motion.div>

            {/* Donut Chart (SVG) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4"
            >
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Category Split
              </h3>
              <div className="flex items-center gap-6">
                {/* SVG donut */}
                <svg viewBox="0 0 42 42" className="w-28 h-28 shrink-0">
                  <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#e5e7eb" strokeWidth="4" className="dark:stroke-gray-700" />
                  {donutSegments.map((seg, i) => (
                    <circle
                      key={seg.category}
                      cx="21" cy="21" r="15.9155"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="4"
                      strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                      strokeDashoffset={-seg.offset}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  ))}
                  <text x="21" y="21" textAnchor="middle" dominantBaseline="central"
                    className="text-[5px] font-bold fill-gray-900 dark:fill-white">
                    {catSorted.length}
                  </text>
                  <text x="21" y="25" textAnchor="middle"
                    className="text-[3px] fill-gray-400">
                    categories
                  </text>
                </svg>
                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {catSorted.map(([cat, amt]) => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                        <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">
                          {meta.emoji} {cat}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {thisTotal > 0 ? Math.round((amt / thisTotal) * 100) : 0}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Category Detail */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4"
            >
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Breakdown
              </h3>
              <div className="space-y-3">
                {catSorted.map(([cat, amt]) => {
                  const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
                  const count = thisMonthExpenses.filter((e) => e.category === cat).length;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: meta.color + '20' }}>
                        <span className="text-lg">{meta.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{cat}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{count} transaction{count !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        ₹{amt.toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Top 3 Expenses */}
            {topExpenses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4"
              >
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                  Top Expenses
                </h3>
                <div className="space-y-3">
                  {topExpenses.map((exp, idx) => {
                    const meta = CATEGORY_META[exp.category] || CATEGORY_META.Other;
                    return (
                      <div key={exp.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-6 text-center">
                          #{idx + 1}
                        </span>
                        <span className="text-xl">{meta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {exp.notes || exp.category}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(exp.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
    </PageTransition>
  );
}

export default MonthlyReport;
