import React, { useState } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import NavMenu from './components/NavMenu';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './components/LoginPage';
import OnboardingScreen from './components/OnboardingScreen';
import Toast from './components/Toast';
import UpdatePassword from './components/UpdatePassword';

// Internal router to manage bottom nav
const AppShell = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isSyncing, session, isAuthLoading, isSyncComplete, customCategories, recurringReminders, addSale, addExpense, language, isRecoveringPassword, setIsRecoveringPassword, userProfile } = useExpense();

  const syncRemindersToHistory = React.useCallback(() => {
    if (!isSyncComplete || !recurringReminders || recurringReminders.length === 0) return;
    const today = new Date();
    const todayDate = today.getDate();
    const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    recurringReminders.forEach(rem => {
      const fireKey = `rem_fired_${rem.id}_${currentMonthKey}`;

      let isTriggerDay = false;
      if (rem.frequency === 'end_of_month') {
        isTriggerDay = (todayDate === lastDayOfMonth);
      } else {
        // Fallback to standard day-based evaluation
        isTriggerDay = (todayDate >= (rem.targetDay || rem.day));
      }

      if (isTriggerDay && !localStorage.getItem(fireKey)) {
        const isoDate = today.toISOString().split('T')[0];
        if (rem.type === 'income') {
          addSale({
            amount: rem.amount,
            category: rem.category || 'Salary',
            date: isoDate,
            desc: `Automated Entry`
          });
        } else {
          addExpense({
            amount: rem.amount,
            category: rem.category || 'Misc',
            date: isoDate,
            desc: `Automated Entry`
          });
        }
        localStorage.setItem(fireKey, 'true');
      }
    });
  }, [isSyncComplete, recurringReminders, addSale, addExpense]);

  // Background Evaluation Loop Hook for Automated Reminders
  React.useEffect(() => {
    window.triggerTestNotification = () => {
      // Forcefully ignore today's real machine date and simulate an active match alert
      const taMsg = "திட்டமிடப்பட்ட நினைவூட்டல்: Rent-க்கான ₹10,000-ஐப் பதிவு செய்ய கிளிக் செய்யவும்!";
      const enMsg = "Scheduled Entry Alert: Tap to log your monthly ₹10,000 for Rent.";
      if (window.showToast) {
        window.showToast(language === 'ta' ? taMsg : enMsg, 'info');
      } else {
        alert(language === 'ta' ? taMsg : enMsg);
      }
    };

    syncRemindersToHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRemindersToHistory]);



  // The Auth-Gate Protector: Show UI during auth load, drop to login only if confirmed NO session.
  if (!isAuthLoading && !session) {
    return <LoginPage />;
  }

  // Password Recovery Gate
  if (isRecoveringPassword) {
    return <UpdatePassword onClose={() => setIsRecoveringPassword(false)} />;
  }

  // The Onboarding Gate: If logged in but no profile is set, force onboarding
  if (!isAuthLoading && session && isSyncComplete && (!userProfile?.name || !userProfile?.type)) {
    return <OnboardingScreen />;
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
    <div className="flex-1 flex flex-col h-full w-full relative">

      {/* --- 1. ISOLATED SCROLLABLE BODY FOR PAGES --- */}
      <div id="main-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden pb-20 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Toast />
        {(isSyncing || isAuthLoading) && (
          <div className="fixed top-4 right-4 z-[999] bg-white/90 backdrop-blur-md text-emerald-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-200 shadow-sm">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.1)" strokeWidth="4" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            {isAuthLoading ? 'Authenticating...' : 'Syncing...'}
          </div>
        )}
        {renderPage()}
      </div>

      {/* --- 2. FIXED NAVIGATION BAR (Pinned tightly to the bottom) --- */}
      <div className="w-full">
        <NavMenu currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center overflow-hidden transition-colors duration-300">
      <div className="w-full h-[100dvh] sm:w-[412px] sm:h-[100vh] bg-slate-50 dark:bg-black relative flex flex-col shadow-none border-none overflow-hidden rounded-none">
        <ExpenseProvider>
          <AppShell />
        </ExpenseProvider>
      </div>
    </div>
  );
}
