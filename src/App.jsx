import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import ExpenseDetail from './pages/ExpenseDetail';
import Onboarding from './pages/Onboarding';
import RecurringExpenses from './pages/RecurringExpenses';
import MonthlyReport from './pages/MonthlyReport';
import PendingExpenses from './pages/PendingExpenses';

// -------------------------------------------------------
// App – Root Component
// -------------------------------------------------------
// Manages dark mode state globally and passes it down.
// Routes: / (Dashboard), /add, /analytics, /settings,
//         /expense/:id (detail view), /onboarding
// -------------------------------------------------------

function App() {
  // Check if user has completed onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_done');
  });

  // Dark mode: default to system preference, allow manual override
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Monthly budget (stored in localStorage)
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    return Number(localStorage.getItem('monthly_budget')) || 0;
  });

  // Apply dark mode class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('dark_mode', darkMode);
  }, [darkMode]);

  const finishOnboarding = () => {
    localStorage.setItem('onboarding_done', 'true');
    setShowOnboarding(false);
  };

  const updateBudget = (value) => {
    setMonthlyBudget(value);
    localStorage.setItem('monthly_budget', value);
  };

  if (showOnboarding) {
    return <Onboarding onFinish={finishOnboarding} />;
  }

  return (
    <BrowserRouter>
      <AnimatedRoutes darkMode={darkMode} setDarkMode={setDarkMode} monthlyBudget={monthlyBudget} updateBudget={updateBudget} />
    </BrowserRouter>
  );
}

function AnimatedRoutes({ darkMode, setDarkMode, monthlyBudget, updateBudget }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard darkMode={darkMode} monthlyBudget={monthlyBudget} />} />
        <Route path="/add" element={<AddExpense darkMode={darkMode} />} />
        <Route path="/analytics" element={<Analytics darkMode={darkMode} />} />
        <Route path="/settings" element={
          <Settings
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            monthlyBudget={monthlyBudget}
            setMonthlyBudget={updateBudget}
          />
        } />
        <Route path="/expense/:id" element={<ExpenseDetail darkMode={darkMode} />} />
        <Route path="/recurring" element={<RecurringExpenses darkMode={darkMode} />} />
        <Route path="/report" element={<MonthlyReport darkMode={darkMode} />} />
        <Route path="/pending" element={<PendingExpenses darkMode={darkMode} />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
