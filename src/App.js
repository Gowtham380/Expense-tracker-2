import React, { useState } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import NavMenu from './components/NavMenu';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './components/LoginPage';
import Toast from './components/Toast';

// Internal router to manage bottom nav
const AppShell = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isSyncing, session, isAuthLoading } = useExpense();

  // The Auth-Gate Protector: Show UI during auth load, drop to login only if confirmed NO session.
  if (!isAuthLoading && !session) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'history': return <HistoryPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto w-full px-4 pt-4 min-h-screen flex flex-col relative">
      <Toast />
      {(isSyncing || isAuthLoading) && (
        <div className="fixed top-4 right-4 z-[999] bg-darkBg/90 backdrop-blur-md text-neonEmerald px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-neonEmerald/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          {isAuthLoading ? 'Authenticating...' : 'Syncing...'}
        </div>
      )}
      {renderPage()}
      <NavMenu currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
};

export default function App() {
  return (
    <ExpenseProvider>
      <AppShell />
    </ExpenseProvider>
  );
}
