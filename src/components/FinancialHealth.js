import React, { useState } from 'react';
import { differenceInDays, endOfMonth } from 'date-fns';
import { useExpense, formatINR } from '../context/ExpenseContext';
import { TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from 'lucide-react';
import AmountInput from './AmountInput';

export default function FinancialHealth() {
  const { transactions, categoryBudgets: rawBudgets, savingsTarget, setSavingsTarget, language } = useExpense();
  const isTA = language === 'ta';
  const categoryBudgets = rawBudgets ?? {};

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(savingsTarget || 0);

  // Calculations
  const currentMonthTransactions = transactions.filter(tx => {
    const d = new Date(tx.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Category Budgets Alerts setup
  const expensesByCategory = currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
    
  const alerts = Object.keys(categoryBudgets).filter(cat => {
    const limit = Number(categoryBudgets[cat]) || 0;
    const spent = expensesByCategory[cat] || 0;
    return limit > 0 && spent >= limit;
  });

  const actualSavings = totalIncome - totalExpenses;
  
  // Forecast
  const today = new Date();
  const daysInMonth = today.getDate();
  const dailyAverageExpense = daysInMonth > 0 ? totalExpenses / daysInMonth : 0;
  
  const endDate = endOfMonth(today);
  const daysRemaining = differenceInDays(endDate, today);
  
  const recurringExpenses = transactions
    .filter(tx => tx.type === 'expense' && tx.isRecurring)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const predictedEndBalance = actualSavings - (dailyAverageExpense * daysRemaining) - recurringExpenses;

  const handleSaveTarget = () => {
    setSavingsTarget(Number(tempTarget));
    setIsEditingTarget(false);
  };

  const progressPct = savingsTarget > 0 ? (actualSavings / savingsTarget) * 100 : 0;
  
  const targetLabel = isTA ? 'சேமிப்பு இலக்கு' : 'Savings Target';
  const healthLabel = isTA ? 'நிதி நிலைமை' : 'Financial Status';

  return (
    <div className="glass-card w-full mb-6 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-neonEmerald/10 rounded-full blur-3xl -mr-16 -mt-16" />
      
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-neonRose/20 border-b border-neonRose/50 p-3 px-6 text-sm flex items-center gap-3">
          <AlertTriangle className="text-neonRose w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold text-neonRose">{isTA ? 'பட்ஜெட் எச்சரிக்கை: ' : 'Budget Alert: '}</span>
            {isTA ? 'நீங்கள் இவற்றின் வரம்பை மீறிவிட்டீர்கள்:' : 'You have exceeded limits for:'} {alerts.join(', ')}
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <PiggyBank className="text-neonEmerald w-6 h-6" />
            {healthLabel}
          </h3>
          
          {isEditingTarget ? (
            <div className="flex items-center gap-2">
              <AmountInput 
                value={tempTarget} 
                onChange={(e) => setTempTarget(e.target.value)}
                className="glass-input py-1 px-3 w-28 text-sm"
              />
              <button onClick={handleSaveTarget} className="btn-emerald py-1 px-3 text-sm">{isTA ? 'சேமி' : 'Save'}</button>
            </div>
          ) : (
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setTempTarget(savingsTarget || 0); setIsEditingTarget(true); }}>
              <div className="text-sm text-gray-400">{targetLabel}</div>
              <div className="font-bold text-lg text-emerald-400">{formatINR(savingsTarget || 0)}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-darkBg/50 p-4 rounded-xl border border-white/5">
            <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
              <TrendingUp className="text-neonEmerald w-4 h-4" /> {isTA ? 'வருமானம்' : 'Income'}
            </div>
            <div className="text-xl font-bold text-neonEmerald">{formatINR(totalIncome)}</div>
          </div>
          <div className="bg-darkBg/50 p-4 rounded-xl border border-white/5">
            <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
              <TrendingDown className="text-neonRose w-4 h-4" /> {isTA ? 'செலவு' : 'Expenses'}
            </div>
            <div className="text-xl font-bold text-neonRose">{formatINR(totalExpenses)}</div>
          </div>
          <div className="bg-darkBg/50 p-4 rounded-xl border border-white/5">
            <div className="text-gray-400 text-sm mb-1">{isTA ? 'எதிர்பார்க்கும் இருப்பு' : 'Predicted Balance'}</div>
            <div className={`text-xl font-bold ${predictedEndBalance >= 0 ? 'text-neonEmerald' : 'text-neonRose'}`}>
              {formatINR(predictedEndBalance)}
            </div>
          </div>
        </div>

        {savingsTarget > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">{isTA ? 'தற்போதைய சேமிப்பு' : 'Actual Savings'}</span>
              <span className={progressPct >= 100 ? 'text-neonEmerald' : 'text-amber-400'}>
                {Math.max(0, progressPct).toFixed(1)}% {isTA ? 'அடையப்பட்டது' : 'Reached'}
              </span>
            </div>
            <div className="w-full h-3 bg-darkBg rounded-full overflow-hidden border border-white/10 relative">
              <div 
                className={`h-full transition-all duration-1000 ${
                  progressPct >= 100 ? 'bg-neonEmerald' : progressPct > 50 ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
