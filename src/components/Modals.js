import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import AmountInput from './AmountInput';
import { showToast } from '../utils/toast';

export default function Modal({ isOpen, onClose, type, initialData }) {
  const { addSale, addExpense, customCategories, transactions, t, tc } = useExpense();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ← double-submit guard
  const amountRef = useRef(null);


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
    } else {
       setCategory('');
    }
    
    setNote('');
    setIsSubmitting(false); // reset guard on modal open
  }, [type, isOpen, initialData, isIncome, customCategories, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // ← guard: block duplicate taps

    // ── Amount validation ───────────────────────────────────────────────────
    const rawValue = amountRef.current?.value || amount;
    const cleanAmount = parseFloat(rawValue);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      showToast('Amount must be greater than ₹0', 'error');
      return; // Operational boundary lock
    }

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

    // ── Category validation ──────────────────────────────────────────────────
    if (!category) {
      showToast('Please select a category.', 'error');
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
      setCategory('');
      setNote('');
      onClose();
    } finally {
      setIsSubmitting(false); // ← always unlock, even if save failed
    }
  };


    const getSortedCategories = () => {
      const filterType = isIncome ? 'income' : 'expense';
      const activeOptions = customCategories?.filter(c => c.type === filterType) || [];
      
      const frequencies = {};
      (transactions || []).forEach(tx => {
        if (tx.type === filterType && tx.category) {
          frequencies[tx.category] = (frequencies[tx.category] || 0) + 1;
        }
      });

      return [...activeOptions].sort((a, b) => {
        const freqA = frequencies[a.name] || 0;
        const freqB = frequencies[b.name] || 0;
        return freqB - freqA;
      });
    };

    const sortedCategories = getSortedCategories();

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black shadow-xl dark:shadow-2xl rounded-3xl p-6 relative overflow-hidden transition-all duration-300 mx-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className={`text-2xl font-bold mb-6 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isIncome ? t('add_income') : t('add_expense')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">{t('amount_label')}</label>
              <AmountInput 
                ref={amountRef}
                required autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white border border-slate-200 dark:border-black dark:border-black focus:border-emerald-500 rounded-2xl p-4 text-2xl font-black text-center shadow-sm tracking-tight placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 transition-colors"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">{t('category_label')}</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black rounded-xl px-4 py-3 text-slate-900 dark:text-white text-lg focus:outline-none focus:border-emerald-500 w-full"
                required
              >
                <option value="" disabled>{t('select_category')}</option>
                {isIncome ? (
                  sortedCategories.map(c => <option key={c.name} value={c.name}>{tc(c.name)}</option>)
                ) : (
                  <optgroup label={tc('category')}>
                    {sortedCategories.map(c => <option key={c.name} value={c.name}>{tc(c.name)}</option>)}
                  </optgroup>
                )}
              </select>
            </div>

          <div className="flex gap-3 w-full">
            {/* Date Container - 40% Width */}
            <div className="w-[40%] flex flex-col">
              <label className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('date_label')}</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 w-full" 
              />
            </div>

            {/* Note Container - 60% Width */}
            <div className="w-[60%] flex flex-col">
              <label className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('note_label')}</label>
              <input 
                type="text" 
                placeholder={t('optional_placeholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 w-full placeholder-slate-400 dark:placeholder-slate-500" 
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-black tracking-wide text-lg transition-all duration-300 transform mt-6 shadow-sm border
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              ${isIncome
                ? 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700'
                : 'bg-rose-600 text-white border-transparent hover:bg-rose-700'
              }`}
          >
            {isSubmitting ? t('saving') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
