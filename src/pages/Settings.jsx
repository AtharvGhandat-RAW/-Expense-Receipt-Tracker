import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import BottomNav from '../components/BottomNav';

// -------------------------------------------------------
// Settings – Budget, Dark Mode, Export, About
// -------------------------------------------------------

function Settings({ darkMode, setDarkMode, monthlyBudget, setMonthlyBudget }) {
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Save budget to localStorage via parent callback
  const saveBudget = () => {
    const val = Number(budgetInput) || 0;
    setMonthlyBudget(val);
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
  };

  // Export all expenses as CSV and trigger a download
  const exportCSV = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        alert('No expenses to export.');
        return;
      }

      // Build CSV string
      const headers = ['ID', 'Amount', 'Category', 'Notes', 'Date', 'Receipt URL'];
      const rows = data.map((e) => [
        e.id,
        e.amount,
        e.category,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
        e.date,
        e.receipt_image_url || '',
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      // Trigger file download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // Reset onboarding
  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_done');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-gray-950 flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-900 w-full flex items-center px-4 shadow-sm">
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-white">Settings</h1>
      </header>

      <main className="flex-1 px-4 pt-20 pb-24 space-y-4">
        {/* ── Dark Mode Toggle ─────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p>
          </div>
          {/* Custom toggle switch */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-12 h-7 rounded-full transition-colors duration-200 ${
              darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            } relative`}
            aria-label="Toggle dark mode"
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 absolute top-1 ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* ── Monthly Budget ───────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">Monthly Budget</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Get warned when approaching your limit</p>
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="e.g. 10000"
              min="0"
              className="flex-1 h-12 bg-transparent border border-gray-400 dark:border-gray-600 rounded-md px-4 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:border-2 focus:outline-none transition-colors"
            />
            <button
              onClick={saveBudget}
              className="h-12 px-6 rounded-full bg-blue-600 text-white font-medium active:bg-blue-700 active:scale-[0.98] transition-all"
            >
              {budgetSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          {monthlyBudget > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Current budget: ₹{monthlyBudget.toLocaleString('en-IN')}/month
            </p>
          )}
        </div>

        {/* ── Export CSV ───────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="mb-3">
            <p className="text-base font-medium text-gray-900 dark:text-white">Export Data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Download all expenses as a CSV file</p>
          </div>
          <button
            onClick={exportCSV}
            disabled={isExporting}
            className={`w-full h-12 rounded-full font-medium border transition-all ${
              isExporting
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 active:bg-blue-50 dark:active:bg-blue-900/20'
            }`}
          >
            {isExporting ? 'Exporting...' : '📥 Export as CSV'}
          </button>
        </div>

        {/* ── Reset Onboarding ─────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="mb-3">
            <p className="text-base font-medium text-gray-900 dark:text-white">Reset Onboarding</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Show the welcome walkthrough again</p>
          </div>
          <button
            onClick={resetOnboarding}
            className="w-full h-12 rounded-full font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* ── About ────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">Expense Tracker</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">v1.0.0</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Built with React + Tailwind + Supabase + Capacitor
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default Settings;
