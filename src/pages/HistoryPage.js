import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useExpense, formatINR, CATEGORIES } from '../context/ExpenseContext';
import {
  Clock, Search, Trash2, Pencil, Check, X,
  RefreshCw, ShieldCheck, Filter, TrendingUp, TrendingDown, XCircle, FileText,
  MoreVertical
} from 'lucide-react';
import AmountInput from '../components/AmountInput';

export default function HistoryPage() {
  const { transactions, deleteTransaction, editTransaction, bulkDelete, isSyncing, customCategories, securePin, language, t, tc } = useExpense();
  const isTA = language === 'ta';

  const [search, setSearch]       = useState('');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});

  const [showPwModal, setShowPwModal]   = useState(false);
  const [pwInput, setPwInput]           = useState(['', '', '', '']);
  const [pwError, setPwError]           = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const pwRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const [openMenuId, setOpenMenuId] = useState(null);

  // Click outside to close menu
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    if (openMenuId) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [openMenuId]);

  useEffect(() => {
    if (showPwModal) { setPwInput(['', '', '', '']); setPwError(''); setTimeout(() => pwRefs[0].current?.focus(), 80); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPwModal]);

  // ── Sticky Header & Profile Logic ────────────────────────────────────
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filtered = useMemo(() => {
    const unifiedTransactions = [...transactions]; // Absolute flat unification, no category grouping
    const q    = search.toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to   = toDate   ? new Date(toDate + 'T23:59:59') : null;
    return unifiedTransactions.filter(tx => {
      const matchText = !q || (tx.desc || '').toLowerCase().includes(q) || (tx.category || '').toLowerCase().includes(q);
      const txDate    = tx.date ? new Date(tx.date) : null;
      const matchFrom = !from || (txDate && txDate >= from);
      const matchTo   = !to   || (txDate && txDate <= to);
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      return matchText && matchFrom && matchTo && matchType;
    }).sort((a, b) => {
      const timeA = new Date(a.created_at || `${a.date}T00:00:00`).getTime();
      const timeB = new Date(b.created_at || `${b.date}T00:00:00`).getTime();
      return timeB - timeA; // Forces pure descending order (Desc) by created_at
    });
  }, [transactions, search, fromDate, toDate, typeFilter]);

  const hasActiveFilters  = search || fromDate || toDate || typeFilter !== 'all';
  const filteredIncome    = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const filteredExpense   = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const clearFilters = () => { setSearch(''); setFromDate(''); setToDate(''); setTypeFilter('all'); setSelectedIds(new Set()); };

  // ── Print filtered view ───────────────────────────────────────────────
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
          ${isTA ? 'கடை நிதி அறிக்கை' : 'Financial Statement'}
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

  // ── Selection ─────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    if (editingId) return;
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
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

  return (
    <div className="space-y-4 animate-in fade-in pb-24">

      {/* ── Password Modal ─────────────────────────────────────────────── */}
      {showPwModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-6 space-y-5 border border-white/20 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-neonEmerald" />
              <div>
                <h3 className="font-bold text-lg">{t('confirm_action')}</h3>
                <p className="text-xs text-gray-400">{t('enter_pin_to_delete')}</p>
              </div>
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
                  className={`w-14 h-14 text-center text-2xl font-bold bg-darkBg/80 border ${pwError ? 'border-neonRose' : 'border-white/20 focus:border-neonEmerald'} rounded-xl shadow-inner outline-none transition-all`}
                />
              ))}
            </div>

            {pwError && <p className="text-neonRose text-xs text-center">{pwError}</p>}
            <div className="flex gap-3">
              <button onClick={confirmPassword} className="flex-1 py-2.5 rounded-xl bg-neonEmerald/20 text-neonEmerald border border-neonEmerald/40 font-semibold hover:bg-neonEmerald hover:text-white transition-all flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Confirm</button>
              <button onClick={cancelPassword} className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 border border-white/10 font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Filter Header ──────────────────────────────────────── */}
      <div className={`sticky top-0 z-40 bg-slate-50/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] py-3.5 flex flex-col ${isScrolled ? 'px-4 space-y-2' : 'px-4 space-y-3'}`}>
        {/* Title row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className={`text-emerald-600 dark:text-neonEmerald transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <h1 className={`font-bold text-slate-900 dark:text-white transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>{t('history')}</h1>
            {isSyncing && <span className="flex items-center gap-1 text-xs text-neonEmerald animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /> Syncing…</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} title="Print / Export PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl text-xs font-black tracking-wide transition-all active:scale-[0.97] cursor-pointer">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="btn-rose py-1 px-2.5 flex items-center gap-1.5 text-xs font-bold">
                <Trash2 className="w-3.5 h-3.5" /> ({selectedIds.size})
              </button>
            )}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <XCircle className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className={`transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 opacity-0' : 'h-10 opacity-100'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} className="glass-input pl-9 w-full py-2 text-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
        </div>

        {/* Date + Type row (Stays visible, compact horizontal scroll layout) */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full items-center">
          <div className="flex items-center gap-2 shrink-0 bg-white text-[#0f172a] dark:bg-slate-900 dark:text-white border border-slate-300 dark:border-white/[0.12] focus-within:border-slate-500 rounded-xl px-3 py-2 text-xs font-bold tracking-wide transition-all">
            <Filter className="w-3.5 h-3.5 text-[#0f172a]/50 dark:text-slate-400" />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent text-[#0f172a] dark:text-white focus:outline-none cursor-pointer" title="From (optional)" placeholder="From" />
          </div>
          <div className="flex items-center gap-2 shrink-0 bg-white text-[#0f172a] dark:bg-slate-900 dark:text-white border border-slate-300 dark:border-white/[0.12] focus-within:border-slate-500 rounded-xl px-3 py-2 text-xs font-bold tracking-wide transition-all">
            <Filter className="w-3.5 h-3.5 text-[#0f172a]/50 dark:text-slate-400" />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent text-[#0f172a] dark:text-white focus:outline-none cursor-pointer" title="To (optional)" placeholder="To" />
          </div>
          <div className="flex bg-[#38240D]/[0.04] p-1 rounded-xl border border-[#38240D]/[0.06] gap-1">
            {[{ val: 'all', label: isTA ? 'அனைத்தும்' : 'All' }, { val: 'income', label: <TrendingUp className="w-4 h-4" /> }, { val: 'expense', label: <TrendingDown className="w-4 h-4" /> }].map(({ val, label }) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex-shrink-0 ${typeFilter === val ? 'bg-[#38240D] text-white shadow-md' : 'text-[#38240D]/60 hover:text-[#38240D] border-transparent'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className={`transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 opacity-0' : 'h-6 opacity-100'}`}>
          {filtered.length > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-white/5 w-full">
              <span>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
              <div className="flex gap-3">
                <span className="text-neonEmerald font-semibold">+{formatINR(filteredIncome)}</span>
                <span className="text-neonRose font-semibold">−{formatINR(filteredExpense)}</span>
                <span className={`font-bold ${filteredIncome - filteredExpense >= 0 ? 'text-neonEmerald' : 'text-neonRose'}`}>Net {formatINR(filteredIncome - filteredExpense)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Transaction List ───────────────────────────────────────────── */}
      <div className="glass-card p-2 md:p-3 min-h-[40vh] mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
            <Search className="w-10 h-10 opacity-20" />
            <p className="font-semibold text-sm">No transactions found</p>
            {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-neonEmerald underline">Clear all filters</button>}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5">
            {filtered.map(tx => (
              <div key={tx.id} onClick={() => toggleSelect(tx.id)}
                className={`bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/[0.05] rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 mb-2.5 transition-shadow hover:shadow-sm cursor-pointer active:scale-[0.98] ${
                  selectedIds.has(tx.id) ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                }`}>

                {/* Checkbox + Type icon */}
                <div className={`w-9 h-9 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                  selectedIds.has(tx.id)
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : tx.type === 'income'
                      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-500/30'
                      : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-500/30'
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
                    <div className="py-2 space-y-2 bg-black/40 p-3 rounded-xl border border-white/5" onClick={e => e.stopPropagation()}>
                      <AmountInput value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="glass-input w-full py-1.5 text-sm" />
                      <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="glass-input w-full py-1.5 text-sm [&>option]:bg-darkCard">
                        {categoryOptions.map(c => <option key={c} value={c}>{tc(c)}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="glass-input flex-1 py-1.5 text-sm text-gray-300" />
                        <input type="text" value={editForm.desc} onChange={e => setEditForm({ ...editForm, desc: e.target.value })} className="glass-input flex-1 py-1.5 text-sm" placeholder="Notes…" />
                      </div>
                      <div className="flex gap-2 pt-1 border-t border-white/10">
                        <button onClick={e => saveEdit(e, tx)} className="flex-1 py-2.5 rounded-lg bg-neonEmerald/20 text-neonEmerald text-xs font-bold hover:bg-neonEmerald hover:text-white transition-all active:scale-95">Save</button>
                        <button onClick={cancelEdit} className="flex-1 py-2.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 transition-all active:scale-95">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[#0f172a] dark:text-slate-100 font-bold text-sm uppercase tracking-wide">{tc(tx.category) || 'Misc'}</span>
                        <p className="text-[#0f172a]/80 dark:text-slate-300 font-medium text-xs truncate leading-tight mt-0.5">{tx.desc || <span className="text-[#0f172a]/50 dark:text-slate-500 italic text-xs">No notes</span>}</p>
                        <p className="text-[#0f172a]/70 dark:text-slate-400 font-semibold text-xs mt-0.5">{tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-sm font-extrabold tracking-tight ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {tx.type === 'income' ? '+' : '−'}{formatINR(tx.amount)}
                        </span>
                        {!selectedIds.has(tx.id) && (
                          <div className="relative flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === tx.id ? null : tx.id);
                              }}
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-gray-400 active:scale-90"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            
                            {/* 3-Dot Dropdown Overlay */}
                            {openMenuId === tx.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={(e) => requestAuth('edit', tx, e)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-slate-700 transition-colors"
                                >
                                  <Pencil className="w-4 h-4 text-blue-400" /> Edit
                                </button>
                                <button
                                  onClick={(e) => requestAuth('delete', tx, e)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-slate-700"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
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
  );
}
