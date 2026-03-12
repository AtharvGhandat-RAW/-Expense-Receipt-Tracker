import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

// -------------------------------------------------------
// Dashboard – Home Screen (Material Design 3)
// -------------------------------------------------------
// Native-Android-style UI with M3 Top App Bar, Material
// Cards for expenses, and a rounded-square FAB.
// -------------------------------------------------------

// Helper: returns a category emoji
function categoryEmoji(category) {
  switch (category) {
    case 'Food':     return '🍔';
    case 'Travel':   return '✈️';
    case 'Supplies': return '📦';
    default:         return '💰';
  }
}

// Helper: formats a date string into "Mar 12, 2026" style
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function Dashboard() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all expenses + subscribe to real-time inserts
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

    // Real-time: prepend newly inserted rows automatically
    const channel = supabase
      .channel('custom-insert-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          setExpenses((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Recalculate total whenever expenses change
  useEffect(() => {
    const sum = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    setTotalSpend(sum);
  }, [expenses]);

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col">
      {/* ── M3 Top App Bar ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white w-full flex items-center px-4 shadow-sm">
        <h1 className="text-[22px] font-medium text-gray-900">Expense Tracker</h1>
      </header>

      {/* ── Main Content ───────────────────────────── */}
      <main className="flex-1 px-4 pt-20 pb-24 space-y-4">
        {/* Total Spend Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide">
            Total Monthly Spend
          </p>
          <p className="text-[36px] font-bold text-blue-600 mt-1">
            ₹{totalSpend.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Section Title */}
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide pt-1">
          Recent Expenses
        </h2>

        {/* Loading State */}
        {isLoading && (
          <p className="text-center text-gray-400 py-12 text-sm">Loading...</p>
        )}

        {/* Empty State */}
        {!isLoading && expenses.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <p className="text-5xl mb-4">🧾</p>
            <p className="text-sm text-gray-500">
              No expenses logged yet. Tap{' '}
              <span className="font-semibold text-blue-600">+</span> to start!
            </p>
          </div>
        )}

        {/* Expense Cards */}
        {!isLoading && expenses.length > 0 && (
          <div>
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex items-center gap-4"
              >
                {/* Category emoji in a tinted circle */}
                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="text-2xl leading-none">{categoryEmoji(exp.category)}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900">
                    ₹{Number(exp.amount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {exp.category} · {formatDate(exp.date)}
                  </p>
                  {exp.notes && (
                    <p className="text-sm text-gray-400 truncate mt-0.5">{exp.notes}</p>
                  )}
                </div>

                {/* Receipt thumbnail */}
                {exp.receipt_image_url && (
                  <img
                    src={exp.receipt_image_url}
                    alt="Receipt"
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── M3 Floating Action Button ──────────────── */}
      <button
        onClick={() => navigate('/add')}
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14
                   rounded-[16px] text-3xl shadow-lg shadow-blue-500/30
                   flex items-center justify-center
                   active:bg-blue-700 active:scale-95 transition-all"
        aria-label="Add expense"
      >
        +
      </button>
    </div>
  );
}

export default Dashboard;
