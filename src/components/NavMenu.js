import React from 'react';
import { LayoutDashboard, PieChart, Clock, Settings } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';

export default function NavMenu({ currentPage, setCurrentPage }) {
  const { t } = useExpense();
  
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'analytics', icon: PieChart, label: t('analytics') },
    { id: 'history', icon: Clock, label: t('history') },
    { id: 'settings', icon: Settings, label: t('settings') }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-black dark:border-black backdrop-blur-xl shadow-lg dark:shadow-2xl pb-safe transition-colors duration-500">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm -translate-y-1.5 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'animate-bounce-small' : ''}`} />
              <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
