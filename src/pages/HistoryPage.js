/**
 * @file HistoryPage.js
 * @description Renders the transaction history ledger with multi-select deletion, search filters, and transaction editing features.
 * @architectural_note: Employs custom pointer event hooks for gesture-based long-press bulk selection.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useExpense, formatINR, CATEGORIES } from '../context/ExpenseContext';
import {
  Clock, Search, Trash2, Pencil, Check, X,
  RefreshCw, Lock, Filter, TrendingUp, TrendingDown, XCircle, FileText,
  MoreVertical
} from 'lucide-react';
import AmountInput from '../components/AmountInput';
import { useFilter } from '../hooks/useFilter';

export default function HistoryPage() {
  const { transactions = [], deleteTransaction, editTransaction, bulkDelete, isSyncing, customCategories, securePin, language, t, tc } = useExpense();
  const isTA = language === 'ta';

  const { filters, setFilters, filtered: initialFiltered } = useFilter(transactions);
  const updateFilters = (newFilters) => setFilters(prev => ({ ...prev, ...newFilters }));
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [visibleCount, setVisibleCount] = useState(20);

  const loadMore = useCallback(() => setVisibleCount(v => v + 20), []);

  // Auto-populate earliest date to today
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Sort to get the earliest date
      const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstDate = sorted[0].date ? sorted[0].date.substring(0, 10) : ''; // Format: YYYY-MM-DD
      const today = new Date().toLocaleDateString('sv-SE');
      
      setFilters(prev => ({
        ...prev,
        fromDate: prev.fromDate || firstDate,
        toDate: prev.toDate || today
      }));
    }
  }, [transactions, setFilters]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [showPwModal, setShowPwModal] = useState(false);
  const [pwInput, setPwInput] = useState(['', '', '', '']);
  const [pwError, setPwError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const pwRef0 = useRef(null);
  const pwRef1 = useRef(null);
  const pwRef2 = useRef(null);
  const pwRef3 = useRef(null);
  const pwRefs = useMemo(() => [pwRef0, pwRef1, pwRef2, pwRef3], []);

  const [openMenuId, setOpenMenuId] = useState(null);

  /**
   * Listens for document-level clicks to dismiss transaction contextual menus.
   */
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    if (openMenuId) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [openMenuId]);

  useEffect(() => {
    if (showPwModal) { 
      setPwInput(['', '', '', '']); 
      setPwError(''); 
      setTimeout(() => pwRefs[0].current?.focus(), 80); 
    }
  }, [showPwModal, pwRefs]);

  const filtered = useMemo(() => {
    try {
      return [...initialFiltered].sort((a, b) => {
        const timeA = new Date(a.created_at || `${a.date}T00:00:00`).getTime();
        const timeB = new Date(b.created_at || `${b.date}T00:00:00`).getTime();
        return timeB - timeA;
      });
    } catch (err) {
      console.error("Sorting error:", err);
      return [];
    }
  }, [initialFiltered]);

  useEffect(() => {
    setVisibleCount(20);
  }, [filters]);

  const hasActiveFilters = filters.search || filters.fromDate || filters.toDate || filters.type !== 'all';
  const filteredIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const filteredExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const clearFilters = () => {
    setFilters({
      search: '',
      fromDate: '',
      toDate: '',
      type: 'all',
      preset: ''
    });
    setSelectedIds(new Set());
  };

  /**
   * Generates a printable iframe containing the filtered financial ledger view.
   */
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const rows = filtered.map(tx => `
      <tr>
        <td style="border:1px solid #ccc;padding:8px">${tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : '-'}</td>
        <td style="border:1px solid #ccc;padding:8px">${tc(tx.category) || '-'}</td>
        <td style="border:1px solid #ccc;padding:8px">${tx.desc || '-'}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:right;font-family:monospace">₹ ${Math.abs(tx.amount || 0).toFixed(2)}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:bold;color:${tx.type === 'income' ? 'green' : 'red'}">${tx.type === 'income' ? 'INCOME' : 'EXPENSE'}</td>
      </tr>`).join('');

    printWindow.document.write(`
      <html><head><title>Expense Report</title></head>
      <body style="font-family:sans-serif;padding:24px;color:#111">
        <h1 style="font-size:24px;font-weight:900;border-bottom:3px solid #111;padding-bottom:8px;margin-bottom:16px">
          ${isTA ? 'நிதி அறிக்கை' : 'Financial Statement'}
        </h1>
        <p style="color:#555;margin-bottom:16px">Generated: ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; ${filtered.length} transactions shown</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead>
            <tr style="background:#f3f4f6;font-size:13px">
              <th style="border:1px solid #ccc;padding:8px;text-align:left">Date</th>
              <th style="border:1px solid #ccc;padding:8px;text-align:left">Category</th>
              <th style="border:1px solid #ccc;padding:8px;text-align:left">Note</th>
              <th style="border:1px solid #ccc;padding:8px;text-align:right">Amount</th>
              <th style="border:1px solid #ccc;padding:8px;text-align:center">Type</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="float:right;background:#f9fafb;border:2px solid #ccc;border-radius:8px;padding:16px;min-width:240px">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Total Income:</span><span style="color:green;font-weight:bold">₹ ${filteredIncome.toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Total Expense:</span><span style="color:red;font-weight:bold">₹ ${filteredExpense.toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;border-top:2px solid #ccc;margin-top:8px;padding-top:8px;font-weight:900;font-size:16px">
            <span>Net:</span><span style="color:${filteredIncome - filteredExpense >= 0 ? 'green' : 'red'}">₹ ${(filteredIncome - filteredExpense).toFixed(2)}</span>
          </div>
        </div>
      </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  };

  const toggleSelect = (id) => {
    if (editingId) return;
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const longPressTimeout = useRef(null);
  const isLongPressTriggered = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  /**
   * Tracks standard pointer-down events. Triggers selection mode on a 600ms hold,
   * unless interactive elements (buttons, inputs) are targeted.
   */
  const handlePointerDown = (e, id) => {
    if (editingId) return;
    if (e.target.closest('.dropdown-trigger') || e.target.closest('.dropdown-menu') || e.target.closest('.edit-container')) {
      return;
    }
    
    if (selectedIds.size > 0) return;

    isLongPressTriggered.current = false;
    touchStartPos.current = { x: e.clientX, y: e.clientY };

    longPressTimeout.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      toggleSelect(id);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 600);
  };

  /**
   * Cancels long-press hold if the pointer moves past a 10px threshold,
   * distinguishing holds from swipe scrolling gestures.
   */
  const handlePointerMove = (e) => {
    if (!longPressTimeout.current) return;
    const diffX = Math.abs(e.clientX - touchStartPos.current.x);
    const diffY = Math.abs(e.clientY - touchStartPos.current.y);
    if (diffX > 10 || diffY > 10) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const handlePointerUp = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const handleEntryClick = (e, id) => {
    if (isLongPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressTriggered.current = false;
      return;
    }
    if (selectedIds.size > 0) {
      toggleSelect(id);
    }
  };

  const executeBulkDelete = () => {
    const income = [], expense = [];
    for (const id of selectedIds) {
      const tx = transactions.find(x => x.id === id);
      if (tx?.type === 'income') income.push(id); else expense.push(id);
    }
    bulkDelete({ income, expense });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (!selectedIds.size) return;
    setPendingAction({ type: 'bulk_delete' });
    setShowPwModal(true);
  };

  // ── Password gate ─────────────────────────────────────────────────────
  const requestAuth = (type, tx, e) => {
    e?.stopPropagation();
    setOpenMenuId(null);
    if (type === 'edit') setEditForm({ amount: tx.amount, category: tx.category || '', date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '', desc: tx.desc || '' });

    if (type === 'edit') {
      setEditingId(tx.id);
      return;
    }

    if (type === 'delete') {
      setPendingAction({ type: 'delete', tx });
      setShowPwModal(true);
    }
  };

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pwInput];
    newPin[index] = value;
    setPwInput(newPin);
    if (value && index < 3) pwRefs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pwInput[index] && index > 0) pwRefs[index - 1].current?.focus();
    if (e.key === 'Enter') confirmPassword();
  };

  const confirmPassword = () => {
    const pinStr = pwInput.join('');
    if (pinStr.length < 4 || pinStr !== securePin) {
      setPwError('Incorrect PIN. Try again.');
      setPwInput(['', '', '', '']);
      pwRefs[0].current?.focus();
      return;
    }
    setShowPwModal(false);
    if (pendingAction?.type === 'delete') {
      deleteTransaction(pendingAction.tx.id, pendingAction.tx.type);
      setSelectedIds(new Set());
    } else if (pendingAction?.type === 'bulk_delete') {
      executeBulkDelete();
    }
    setPendingAction(null);
  };
  const cancelPassword = () => { setShowPwModal(false); setPendingAction(null); };

  // ── Edit ──────────────────────────────────────────────────────────────
  const saveEdit = async (e, tx) => {
    e.stopPropagation();
    if (!editForm.amount || isNaN(editForm.amount) || Number(editForm.amount) < 0) return alert('Enter a valid positive amount.');
    await editTransaction(tx.id, tx.type, { amount: parseFloat(editForm.amount), category: editForm.category, date: new Date(editForm.date).toISOString(), desc: editForm.desc });
    setEditingId(null);
  };
  const cancelEdit = (e) => { e.stopPropagation(); setEditingId(null); };

  const categoryOptions = customCategories ? customCategories.map(c => c.name) : [...CATEGORIES.INCOME, ...CATEGORIES.PERSONAL];

  // Handle infinite scroll using the global scroll container
  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      if (Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 2) {
        loadMore();
      }
    };
    
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loadMore]);

  try {
    return (
      <div className="w-full relative animate-in fade-in pb-20 bg-slate-50 dark:bg-black">

    {/* ── Password Modal ─────────────────────────────────────────────── */}
    {showPwModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl w-full max-w-sm p-6 space-y-5 border border-slate-200 dark:border-black dark:border-black shadow-xl dark:shadow-2xl animate-in zoom-in-95">
          <div className="flex flex-col items-center justify-center space-y-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('confirm_action')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('enter_pin_to_delete')}</p>
          </div>

          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map(i => (
              <input
                key={i}
                ref={pwRefs[i]}
                type="password"
                maxLength={1}
                value={pwInput[i]}
                onChange={e => { handlePinChange(i, e.target.value); setPwError(''); }}
                onKeyDown={e => handlePinKeyDown(i, e)}
                className={`w-14 h-14 text-center text-2xl font-bold bg-slate-50 dark:bg-[#1e293b] border ${pwError ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-slate-200 dark:border-black dark:border-black focus:border-emerald-500 text-slate-900 dark:text-white'} rounded-xl shadow-sm outline-none transition-all`}
              />
            ))}
          </div>

          {pwError && <p className="text-rose-600 text-xs text-center font-semibold">{pwError}</p>}
          <div className="flex gap-3">
            <button onClick={confirmPassword} className="flex-1 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"><Check className="w-4 h-4" /> {t('confirm')}</button>
            <button onClick={cancelPassword} className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-black dark:border-black font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"><X className="w-4 h-4" /> {t('cancel')}</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Sticky Filter Header ──────────────────────────────────────── */}
    <div className="sticky top-0 z-[50] w-full pt-2 px-2 md:max-w-4xl lg:max-w-5xl md:mx-auto">
      <div className="relative overflow-hidden glass-premium rounded-2xl p-3 shadow-2xl transition-all duration-300">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-rose-500/20 blur-xl opacity-50"></div>
        <div className="flex gap-2 items-center relative z-10">
        <div className="relative flex-1 glass-premium rounded-xl shadow-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={filters.search}
            onChange={e => updateFilters({ search: e.target.value })}
            className="w-full bg-transparent pl-9 pr-8 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl"
          />
          {filters.search && <button onClick={() => updateFilters({ search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
        {selectedIds.size > 0 ? (
          <button
            onClick={handleBulkDelete}
            className="p-2.5 bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-500/30 shadow-sm flex items-center gap-1 transition-all"
          >
            <Trash2 className="w-5 h-5" />
            <span className="font-bold text-xs">{selectedIds.size}</span>
          </button>
        ) : (
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle Filters"
            className={`p-2.5 rounded-xl glass-premium transition-colors shadow-sm ${showFilters ? 'text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* --- COLLAPSIBLE DRAWER --- */}
        {showFilters && (
          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 pb-2 relative z-10">
            <div className="flex items-center justify-between">
            <h1 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('history')}
              {isSyncing && <span className="flex items-center gap-1 text-xs text-emerald-600 animate-pulse ml-2"><RefreshCw className="w-3 h-3 animate-spin" /> {t('syncing')}</span>}
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} title="Print / Export PDF"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all active:scale-[0.97] cursor-pointer">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all shadow-sm">
                  <XCircle className="w-3.5 h-3.5" /> {t('clear_btn')}
                </button>
              )}
            </div>
          </div>

          {/* Date row */}
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full items-center">
            <div className="flex items-center gap-2 flex-1 bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-black dark:border-black rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-sm dark:shadow-none">
              <input type="date" value={filters.fromDate} onChange={e => updateFilters({ fromDate: e.target.value })} className="bg-transparent text-slate-900 dark:text-white focus:outline-none w-full cursor-pointer" title="From" />
            </div>
            <div className="flex items-center gap-2 flex-1 bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-black dark:border-black rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-sm dark:shadow-none">
              <input type="date" value={filters.toDate} onChange={e => updateFilters({ toDate: e.target.value })} className="bg-transparent text-slate-900 dark:text-white focus:outline-none w-full cursor-pointer" title="To" />
            </div>
          </div>

          <div className="flex bg-white dark:bg-[#1f2937] shadow-sm dark:shadow-none border border-slate-200 dark:border-black dark:border-black rounded-xl p-1 gap-1">
            {[{ val: 'all', label: isTA ? 'அனைத்தும்' : 'All' }, { val: 'income', label: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> }, { val: 'expense', label: <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" /> }].map(({ val, label }) => (
              <button key={val} onClick={() => updateFilters({ type: val })}
                className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${filters.type === val
                  ? val === 'income' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 shadow-sm'
                    : val === 'expense' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-black dark:border-black shadow-sm'
                  : 'text-slate-500 border border-transparent hover:text-slate-900 dark:hover:text-white'
                  }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary (Always visible) */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 pt-2 mt-2 border-t border-white/10 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <span className="whitespace-nowrap mr-3">{filtered.length} {filtered.length === 1 ? (isTA ? 'பதிவு' : 'entry') : (isTA ? 'பதிவுகள்' : 'entries')}</span>
          <div className="flex gap-2 sm:gap-3 whitespace-nowrap">
            <span className="text-emerald-600 font-semibold">+{formatINR(filteredIncome)}</span>
            <span className="text-rose-600 font-semibold">−{formatINR(filteredExpense)}</span>
            <span className={`font-bold ${filteredIncome - filteredExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{isTA ? 'நிகர இருப்பு' : 'Net'} {formatINR(filteredIncome - filteredExpense)}</span>
          </div>
        </div>
      )}
      </div>
    </div>

    {/* ── Scrollable Body Content ─────────────────────────────────────── */}
    <div className="w-full space-y-3 p-4 bg-slate-50 dark:bg-black">

      {/* ── Transaction List ───────────────────────────────────────────── */}
      <div className="p-2 md:p-3 min-h-[40vh] mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Search className="w-10 h-10 opacity-20" />
            <p className="font-semibold text-sm">{t('no_transactions')}</p>
            {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-emerald-600 underline">{t('clear_all_filters')}</button>}
          </div>
        ) : (
          <div className="flex flex-col space-y-2 pb-16">
            {filtered.slice(0, visibleCount).map(tx => (
              <div key={tx.id}
                onPointerDown={(e) => handlePointerDown(e, tx.id)}
                onPointerUp={handlePointerUp}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onPointerCancel={handlePointerUp}
                onClick={(e) => handleEntryClick(e, tx.id)}
                className={`p-4 premium-card border-l-4 rounded-xl flex items-center justify-between gap-3 transition-colors duration-300 hover:shadow-lg cursor-pointer active:scale-[0.98] ${tx.type === 'income' ? 'border-l-emerald-500' : 'border-l-rose-500'
                  } ${selectedIds.has(tx.id) ? 'ring-1 ring-emerald-500/50 bg-slate-50 dark:bg-[#1f2937]' : ''
                  }`}>

                {/* Checkbox + Type icon */}
                <div className={`w-9 h-9 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${selectedIds.has(tx.id)
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : tx.type === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                  }`}>
                  {selectedIds.has(tx.id)
                    ? <Check className="w-4 h-4" />
                    : tx.type === 'income'
                      ? <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      : <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  }
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  {editingId === tx.id ? (
                    <div className="py-2 space-y-2 bg-slate-50 dark:bg-[#1e293b] p-3 rounded-xl border border-slate-200 dark:border-black dark:border-black shadow-sm edit-container" onClick={e => e.stopPropagation()}>
                      <AmountInput value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black rounded-lg px-3 w-full py-1.5 text-sm dark:text-white" />
                      <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black rounded-lg px-3 w-full py-1.5 text-sm dark:text-white">
                        {categoryOptions.map(c => <option key={c} value={c}>{tc(c)}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black rounded-lg px-3 flex-1 py-1.5 text-sm text-slate-900 dark:text-white" />
                        <input type="text" value={editForm.desc} onChange={e => setEditForm({ ...editForm, desc: e.target.value })} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black rounded-lg px-3 flex-1 py-1.5 text-sm dark:text-white" placeholder={t('notes_placeholder')} />
                      </div>
                      <div className="flex gap-2 pt-1 border-t border-slate-200 dark:border-black dark:border-black mt-2">
                        <button onClick={e => saveEdit(e, tx)} className="flex-1 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 shadow-sm text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-all active:scale-95">{t('save')}</button>
                        <button onClick={cancelEdit} className="flex-1 py-2 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black shadow-sm text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-all active:scale-95">{t('cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wide">
                          {tx.desc?.includes('Automated') ? `${tc(tx.category).toUpperCase()}: ${isTA ? 'தானியங்கி பதிவு' : 'AUTOMATED ENTRY'}` : (tc(tx.category) || (isTA ? 'இதர' : 'Other'))}
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 font-medium text-xs truncate leading-tight mt-0.5">{tx.desc || <span className="text-slate-400 dark:text-slate-500 italic text-xs">{t('no_notes')}</span>}</p>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs mt-0.5">{tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : t('unknown_date')}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-sm font-extrabold tracking-tight ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'income' ? '+' : '−'}{formatINR(tx.amount)}
                        </span>
                        {!selectedIds.has(tx.id) && (
                          <div className="relative flex items-center">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === tx.id ? null : tx.id);
                              }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 active:scale-90 dropdown-trigger"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {/* 3-Dot Dropdown Overlay */}
                            {openMenuId === tx.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-black dark:border-black rounded-xl shadow-xl dark:shadow-none dark:ring-1 dark:ring-slate-800 z-50 overflow-hidden dropdown-menu" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={(e) => requestAuth('edit', tx, e)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <Pencil className="w-4 h-4 text-blue-500 dark:text-blue-400" /> {t('edit_label')}
                                </button>
                                <button
                                  onClick={(e) => requestAuth('delete', tx, e)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border-t border-slate-100 dark:border-black"
                                >
                                  <Trash2 className="w-4 h-4" /> {t('delete_label')}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
    );
  } catch (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-black text-slate-900 dark:text-white">
        <div className="bg-rose-50 dark:bg-rose-500/10 p-6 rounded-2xl border border-rose-200 dark:border-rose-500/20 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-8 h-8 text-rose-500" />
            <h2 className="text-xl font-bold text-rose-600 dark:text-rose-400">Render Error</h2>
          </div>
          <p className="text-sm font-mono whitespace-pre-wrap p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-black dark:border-black">{error.message}</p>
        </div>
      </div>
    );
  }
}
