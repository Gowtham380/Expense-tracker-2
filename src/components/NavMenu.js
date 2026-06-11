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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0f172a]/95 border-t border-slate-200 dark:border-white/[0.04] backdrop-blur-xl shadow-[0_-4px_24px_rgba(15,23,42,0.015)] pb-safe transition-colors duration-500">
      <div className="flex justify-around items-center h-20 max-w-2xl mx-auto px-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-[#0f172a] bg-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:text-emerald-400 dark:bg-emerald-500/10 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] -translate-y-2 font-bold' : 'text-[#0f172a]/50 dark:text-slate-500 hover:text-[#0f172a] dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'animate-bounce-small' : ''}`} />
              <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
