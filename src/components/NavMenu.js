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
    <nav className="fixed bottom-0 left-0 right-0 bg-darkCard/90 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
      <div className="flex justify-around items-center h-20 max-w-2xl mx-auto px-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-neonEmerald bg-neonEmerald/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] -translate-y-2' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
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
