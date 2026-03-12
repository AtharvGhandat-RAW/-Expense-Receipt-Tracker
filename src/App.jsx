import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';

// -------------------------------------------------------
// App – Root Component
// -------------------------------------------------------
// Sets up client-side routing with React Router.
// Two routes are defined:
//   /     → Dashboard (home screen, shows expenses)
//   /add  → AddExpense (form to create a new expense)
// -------------------------------------------------------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddExpense />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
