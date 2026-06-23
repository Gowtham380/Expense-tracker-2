import React, { useState } from 'react';
import { differenceInDays, endOfMonth } from 'date-fns';
import { useExpense, formatINR } from '../context/ExpenseContext';
import { TrendingUp, TrendingDown, PiggyBank, AlertTriangle, Wallet } from 'lucide-react';
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
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black shadow-[0_8px_30px_rgba(15,23,42,0.015)] rounded-2xl p-5 w-full mb-6 relative overflow-hidden flex flex-col transition-colors duration-300">
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

      <div className="w-full mt-2">
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
              <div className="text-sm text-slate-400">{targetLabel}</div>
              <div className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{formatINR(savingsTarget || 0)}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3.5 mt-4 mb-6">
          {/* Income Row */}
          <div className="flex flex-col justify-center bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black p-3.5 rounded-xl min-w-0">
            <div className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-1.5 flex items-center gap-2">
              <TrendingUp className="text-emerald-600 dark:text-emerald-400 w-4 h-4" />
              {isTA ? 'வருமானம்' : 'Income'}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate max-w-full block" title={formatINR(totalIncome)}>
              {formatINR(totalIncome)}
            </div>
          </div>

          {/* Expenses Row */}
          <div className="flex flex-col justify-center bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black p-3.5 rounded-xl min-w-0">
            <div className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-1.5 flex items-center gap-2">
              <TrendingDown className="text-rose-600 dark:text-rose-400 w-4 h-4" />
              {isTA ? 'செலவு' : 'Expenses'}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 truncate max-w-full block" title={formatINR(totalExpenses)}>
              {formatINR(totalExpenses)}
            </div>
          </div>

          {/* Predicted Balance Row */}
          <div className="flex flex-col justify-center bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black p-3.5 rounded-xl min-w-0">
            <div className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-1.5 flex items-center gap-2">
              <Wallet className={`w-4 h-4 ${predictedEndBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
              {isTA ? 'எதிர்பார்க்கும் இருப்பு' : 'Predicted Balance'}
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold truncate max-w-full block ${predictedEndBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} title={formatINR(predictedEndBalance)}>
              {formatINR(predictedEndBalance)}
            </div>
          </div>
        </div>

        {savingsTarget > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">{isTA ? 'தற்போதைய சேமிப்பு' : 'Actual Savings'}</span>
              <span className={progressPct >= 100 ? 'text-neonEmerald' : 'text-amber-400'}>
                {Math.max(0, progressPct).toFixed(1)}% {isTA ? 'அடையப்பட்டது' : 'Reached'}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-black dark:border-black rounded-full overflow-hidden relative">
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
