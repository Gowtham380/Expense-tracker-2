import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useExpense, formatINR, CATEGORIES } from '../context/ExpenseContext';
import {
  Clock, Search, Trash2, Pencil, Check, X,
  RefreshCw, ShieldCheck, Filter, TrendingUp, TrendingDown, XCircle, FileText
} from 'lucide-react';
import AmountInput from '../components/AmountInput';

const APP_PASSWORD = '1234';

export default function HistoryPage() {
  const { transactions, deleteTransaction, editTransaction, bulkDelete, isSyncing, appMode, language, t, tc } = useExpense();
  const isTA = language === 'ta';

  const [search, setSearch]       = useState('');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});

  const [showPwModal, setShowPwModal]   = useState(false);
  const [pwInput, setPwInput]           = useState('');
  const [pwError, setPwError]           = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const pwRef = useRef(null);

  useEffect(() => {
    if (showPwModal) { setPwInput(''); setPwError(''); setTimeout(() => pwRef.current?.focus(), 80); }
  }, [showPwModal]);

  // ── Sticky Header & Profile Logic ────────────────────────────────────
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Filtered transactions ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q    = search.toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to   = toDate   ? new Date(toDate + 'T23:59:59') : null;
    return transactions.filter(tx => {
      const matchText = !q || (tx.desc || '').toLowerCase().includes(q) || (tx.category || '').toLowerCase().includes(q);
      const txDate    = tx.date ? new Date(tx.date) : null;
      const matchFrom = !from || (txDate && txDate >= from);
      const matchTo   = !to   || (txDate && txDate <= to);
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      return matchText && matchFrom && matchTo && matchType;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
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

  const handleBulkDelete = () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Delete ${selectedIds.size} item(s)?`)) return;
    const income = [], expense = [];
    for (const id of selectedIds) {
      const tx = transactions.find(x => x.id === id);
      if (tx?.type === 'income') income.push(id); else expense.push(id);
    }
    bulkDelete({ income, expense });
    setSelectedIds(new Set());
  };

  // ── Password gate ─────────────────────────────────────────────────────
  const requestAuth = (type, tx, e) => {
    e.stopPropagation();
    if (type === 'edit') setEditForm({ amount: tx.amount, category: tx.category || '', date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '', desc: tx.desc || '' });
    setPendingAction({ type, tx });
    setShowPwModal(true);
  };

  const confirmPassword = () => {
    if (pwInput !== APP_PASSWORD) { setPwError('Incorrect password. Try again.'); setPwInput(''); pwRef.current?.focus(); return; }
    setShowPwModal(false);
    if (pendingAction?.type === 'delete') { deleteTransaction(pendingAction.tx.id, pendingAction.tx.type); setSelectedIds(new Set()); }
    else if (pendingAction?.type === 'edit') setEditingId(pendingAction.tx.id);
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

  const categoryOptions = appMode === 'kadai'
    ? [...CATEGORIES.KADAI, ...CATEGORIES.SPECIAL]
    : [...CATEGORIES.VEEDU, ...CATEGORIES.SPECIAL];

  return (
    <div className="space-y-4 animate-in fade-in pb-24">

      {/* ── Password Modal ─────────────────────────────────────────────── */}
      {showPwModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-6 space-y-5 border border-white/20 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-neonEmerald" />
              <div>
                <h3 className="font-bold text-lg">Confirm Action</h3>
                <p className="text-xs text-gray-400">Enter password to {pendingAction?.type === 'delete' ? 'delete' : 'edit'} this transaction.</p>
              </div>
            </div>
            <input ref={pwRef} type="password" value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(''); }}
              onKeyDown={e => e.key === 'Enter' && confirmPassword()}
              placeholder="Enter password…"
              className={`glass-input w-full py-3 text-center tracking-widest text-lg ${pwError ? '!border-neonRose' : ''}`} />
            {pwError && <p className="text-neonRose text-xs text-center">{pwError}</p>}
            <div className="flex gap-3">
              <button onClick={confirmPassword} className="flex-1 py-2.5 rounded-xl bg-neonEmerald/20 text-neonEmerald border border-neonEmerald/40 font-semibold hover:bg-neonEmerald hover:text-white transition-all flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Confirm</button>
              <button onClick={cancelPassword} className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 border border-white/10 font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Filter Header ──────────────────────────────────────── */}
      <div className={`sticky top-0 z-30 transition-all duration-300 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-b border-white/10 flex flex-col ${isScrolled ? 'bg-darkCard/80 py-2.5 px-4 space-y-2' : 'glass-card p-4 space-y-3'}`}>
        {/* Title row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className={`text-neonEmerald transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <h1 className={`font-bold transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>{t('history')}</h1>
            {isSyncing && <span className="flex items-center gap-1 text-xs text-neonEmerald animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /> Syncing…</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} title="Print / Export PDF"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-neonEmerald/10 border border-neonEmerald/30 text-neonEmerald hover:bg-neonEmerald hover:text-white transition-all font-semibold">
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
          <div className={`flex items-center gap-2 shrink-0 bg-darkBg/50 border border-white/10 rounded-xl px-3 transition-all duration-300 ${isScrolled ? 'py-1.5' : 'py-2'}`}>
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent text-sm text-white focus:outline-none cursor-pointer" title="From (optional)" placeholder="From" />
          </div>
          <div className={`flex items-center gap-2 shrink-0 bg-darkBg/50 border border-white/10 rounded-xl px-3 transition-all duration-300 ${isScrolled ? 'py-1.5' : 'py-2'}`}>
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent text-sm text-white focus:outline-none cursor-pointer" title="To (optional)" placeholder="To" />
          </div>
          <div className={`flex shrink-0 bg-darkBg/50 border border-white/10 rounded-xl gap-1 transition-all duration-300 ${isScrolled ? 'p-0.5' : 'p-1'}`}>
            {[{ val: 'all', label: isTA ? 'அனைத்தும்' : 'All' }, { val: 'income', label: <TrendingUp className="w-4 h-4" /> }, { val: 'expense', label: <TrendingDown className="w-4 h-4" /> }].map(({ val, label }) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                className={`flex items-center justify-center px-3 rounded-lg text-xs font-bold transition-all border ${isScrolled ? 'py-1.5' : 'py-1.5'} ${typeFilter === val ? val === 'income' ? 'bg-neonEmerald/20 text-neonEmerald border-neonEmerald/40' : val === 'expense' ? 'bg-neonRose/20 text-neonRose border-neonRose/40' : 'bg-white/10 text-white border-white/20' : 'text-gray-500 border-white/5 hover:text-white'}`}>
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
                className={`relative flex items-center gap-3 px-3 py-3 transition-all cursor-pointer rounded-xl active:scale-[0.98] ${
                  selectedIds.has(tx.id) ? 'bg-indigo-500/20' : 'hover:bg-white/5 active:bg-white/10'
                }`}>

                {/* Checkbox + Type icon — w-9 h-9 = 36px, meets minimum tap target with row padding */}
                <div className={`w-9 h-9 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                  selectedIds.has(tx.id)
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : tx.type === 'income'
                      ? 'bg-neonEmerald/10 border-neonEmerald/30'
                      : 'bg-neonRose/10 border-neonRose/30'
                }`}>
                  {selectedIds.has(tx.id)
                    ? <Check className="w-4 h-4" />
                    : tx.type === 'income'
                      ? <TrendingUp className="w-4 h-4 text-neonEmerald" />
                      : <TrendingDown className="w-4 h-4 text-neonRose" />
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
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{tc(tx.category) || 'Misc'}</span>
                        <p className="text-sm font-medium text-gray-200 truncate leading-tight">{tx.desc || <span className="text-gray-600 italic text-xs">No notes</span>}</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">{tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-sm font-black tracking-tight ${tx.type === 'income' ? 'text-neonEmerald' : 'text-neonRose'}`}>
                          {tx.type === 'income' ? '+' : '−'}{formatINR(tx.amount)}
                        </span>
                        {!selectedIds.has(tx.id) && (
                          <div className="flex items-center gap-0.5">
                            {/* p-2 + w-4 h-4 = ~32px icon area, acceptable with finger */}
                            <button onClick={(e) => requestAuth('edit', tx, e)} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-all text-gray-500 active:scale-90"><Pencil className="w-4 h-4" /></button>
                            <button onClick={(e) => requestAuth('delete', tx, e)} className="p-2 hover:bg-neonRose/20 hover:text-neonRose rounded-lg transition-all text-gray-500 active:scale-90"><Trash2 className="w-4 h-4" /></button>
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
