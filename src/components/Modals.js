import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import AmountInput from './AmountInput';
import { showToast } from '../utils/toast';

export default function Modal({ isOpen, onClose, type, initialData }) {
  const { addSale, addExpense, customCategories, t, tc } = useExpense();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ← double-submit guard


  const isIncome = type === 'income';

  useEffect(() => {
    if (!isOpen) return;

    // Structural Safety Redirection Guard
    const activeOptions = customCategories?.filter(c => c.type === (isIncome ? 'income' : 'expense')) || [];
    if (activeOptions.length === 0) {
      alert(`Missing ${isIncome ? 'Income' : 'Expense'} Category! Please configure it in Settings first.`);
      onClose();
      return;
    }

    if (initialData?.amount) setAmount(initialData.amount);
    else setAmount('');
    
    if (initialData?.category) {
       setCategory(initialData.category);
        setCategory(activeOptions[0]?.name || 'Others');
    }
    
    setNote('');
    setIsSubmitting(false); // reset guard on modal open
  }, [type, isOpen, initialData, isIncome, customCategories, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // ← guard: block duplicate taps

    // ── Amount validation ───────────────────────────────────────────────────
    const cleanAmount = parseFloat(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) return; // Operational boundary lock

    // ── Date validation ─────────────────────────────────────────────────────
    if (!date) {
      showToast('Please select a date.', 'error');
      return;
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      showToast('Invalid date. Please pick a valid date.', 'error');
      return;
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedDate > today) {
      showToast('Date cannot be in the future.', 'error');
      return;
    }

    // ── Precision fix: round to 2 decimal places before storing ─────────────
    const safeAmount = Math.round(cleanAmount * 100) / 100;

    const payload = {
      amount: safeAmount,
      category,
      date: parsedDate.toISOString(),
      desc: note || `${tc(category)} entry`
    };

    setIsSubmitting(true); // ← lock button
    try {
      if (isIncome) {
        await addSale(payload);
      } else {
        await addExpense(payload);
      }
      setAmount('');
      setNote('');
      onClose();
    } finally {
      setIsSubmitting(false); // ← always unlock, even if save failed
    }
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#151f32] border border-slate-200/80 dark:border-white/[0.08] shadow-[0_20px_50px_rgba(15,23,42,0.08)] rounded-3xl p-6 relative overflow-hidden transition-all duration-300 mx-4">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className={`text-2xl font-bold mb-6 ${isIncome ? 'text-neonEmerald' : 'text-neonRose'}`}>
          {isIncome ? t('add_income') : t('add_expense')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount (₹)</label>
            <AmountInput 
              required autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/60 text-[#0f172a] dark:text-white border border-slate-300 dark:border-white/[0.15] focus:border-[#0f172a] dark:focus:border-emerald-500 rounded-2xl p-4 text-2xl font-black text-center shadow-inner tracking-tight placeholder:text-slate-400 focus:ring-0 transition-colors"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input [&>optgroup]:bg-darkCard [&>option]:bg-darkCard py-3 text-lg"
            >
              {isIncome ? (
                (customCategories?.filter(c => c.type === 'income') || []).map(c => <option key={c.name} value={c.name}>{tc(c.name)}</option>)
              ) : (
                <optgroup label={tc('category')}>
                  {(customCategories?.filter(c => c.type === 'expense') || []).map(c => <option key={c.name} value={c.name}>{tc(c.name)}</option>)}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input py-3"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Note (Optional)</label>
              <input 
                type="text" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="glass-input py-3"
                placeholder="..."
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-black tracking-wide text-lg transition-all duration-300 transform mt-6 shadow-sm border
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              ${isIncome
                ? 'bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-400 border-transparent dark:border-emerald-500/30 hover:bg-emerald-700 dark:hover:bg-emerald-500/30'
                : 'bg-rose-600 dark:bg-rose-500/20 text-white dark:text-rose-400 border-transparent dark:border-rose-500/30 hover:bg-rose-700 dark:hover:bg-rose-500/30'
              }`}
          >
            {isSubmitting ? 'Saving…' : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
