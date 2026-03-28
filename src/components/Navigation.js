import React from 'react';
import { Home, PieChart, Clock, Settings } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';

export default function Navigation({ activeTab, setActiveTab }) {
  const { t } = useExpense();

  const navItems = [
    { id: 'dashboard', icon: Home, label: t('dashboard') },
    { id: 'analytics', icon: PieChart, label: t('analytics') },
    { id: 'history', icon: Clock, label: t('history') },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl rounded-b-none border-t border-white/10 p-2 z-50 md:sticky md:top-0 md:rounded-2xl md:border md:mb-6">
      <ul className="flex justify-around items-center">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id} className="w-full">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex flex-col items-center py-2 transition-all duration-300 ${
                  isActive ? 'text-neonEmerald' : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className={`relative p-2 rounded-xl transition-all ${isActive ? 'bg-neonEmerald/10' : ''}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : ''}`} />
                </div>
                <span className="text-[10px] sm:text-xs mt-1 font-medium">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
