import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useExpense, CATEGORIES } from '../context/ExpenseContext';
import AmountInput from './AmountInput';
import { showToast } from '../utils/toast';

export default function Modal({ isOpen, onClose, type, initialData }) {
  const { addSale, addExpense, appMode, t, tc } = useExpense();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ← double-submit guard

  const isIncome = type === 'income';

  useEffect(() => {
    if (initialData?.amount) setAmount(initialData.amount);
    else setAmount('');
    
    if (initialData?.category) {
       setCategory(initialData.category);
    } else {
       if (type === 'expense') {
         setCategory(appMode === 'kadai' ? CATEGORIES.KADAI[0] : CATEGORIES.VEEDU[0]);
       } else if (isIncome) {
         setCategory(CATEGORIES.INCOME[0]);
       }
    }
    
    setNote('');
    setIsSubmitting(false); // reset guard on modal open
  }, [type, appMode, isOpen, initialData, isIncome]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // ← guard: block duplicate taps

    // ── Amount validation ───────────────────────────────────────────────────
    const rawAmount = parseFloat(amount);
    if (!amount || isNaN(rawAmount) || rawAmount <= 0) return;

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
    const safeAmount = Math.round(rawAmount * 100) / 100;

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
      <div className="glass-card w-full max-w-md p-6 relative bg-darkCard border-white/20 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className={`text-2xl font-bold mb-6 ${isIncome ? 'text-neonEmerald' : 'text-neonRose'}`}>
          {isIncome ? t('dailySales') : t('expenseTitle')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount (₹)</label>
            <AmountInput 
              required autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full bg-darkBg/80 border ${isIncome ? 'border-neonEmerald/30 focus:border-neonEmerald' : 'border-neonRose/30 focus:border-neonRose'} rounded-xl px-4 py-4 text-3xl font-bold text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all`}
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
                CATEGORIES.INCOME.map(c => <option key={c} value={c}>{tc(c)}</option>)
              ) : (
                <>
                  {appMode === 'kadai' && (
                    <optgroup label={tc('kadaiMode')}>
                      {CATEGORIES.KADAI.map(c => <option key={c} value={c}>{tc(c)}</option>)}
                    </optgroup>
                  )}
                  {appMode === 'veedu' && (
                    <optgroup label={tc('veeduMode')}>
                      {CATEGORIES.VEEDU.map(c => <option key={c} value={c}>{tc(c)}</option>)}
                    </optgroup>
                  )}
                  <optgroup label={t('specialExpenses')}>
                    {CATEGORIES.SPECIAL.map(c => <option key={c} value={c}>{tc(c)}</option>)}
                  </optgroup>
                </>
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
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform mt-6 border
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              ${isIncome
                ? 'bg-neonEmerald/20 text-neonEmerald border-neonEmerald/50 hover:bg-neonEmerald hover:text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-neonRose/20 text-neonRose border-neonRose/50 hover:bg-neonRose hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.5)]'
              }`}
          >
            {isSubmitting ? 'Saving…' : `${t('save')} ${isIncome ? t('income') : t('expenses')}`}
          </button>
        </form>
      </div>
    </div>
  );
}
