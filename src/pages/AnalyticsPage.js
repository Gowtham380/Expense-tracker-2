import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { useExpense, formatINR, CATEGORIES } from '../context/ExpenseContext';
import { BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Search, Filter, XCircle, X } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'];

const PRESETS = [
  { label: 'இந்த மாதம்', labelEn: 'This Month', id: 'month' },
  { label: 'கடந்த மாதம்', labelEn: 'Last Month', id: 'prev' },
  { label: 'இந்த ஆண்டு', labelEn: 'Current Year', id: 'year' },
];

function applyPreset(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (preset === 'month') return { from: startOfMonth(now), to: today };
  if (preset === 'prev')  return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
  if (preset === 'year')  return { from: startOfYear(now), to: endOfYear(now) };
  return null;
}

function pct(current, prev) {
  if (!prev) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

export default function AnalyticsPage() {
  const { transactions, customCategories, language, t, tc } = useExpense();
  const isTA = language === 'ta';

  const [search, setSearch]       = useState('');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [preset, setPreset]       = useState('month');

  // Sticky Scroll Logic
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync preset to custom dates when clicked
  const handlePresetClick = (pid) => {
    setPreset(pid);
    const range = applyPreset(pid);
    if (range) {
      setFromDate(range.from.toISOString().split('T')[0]);
      setToDate(range.to.toISOString().split('T')[0]);
    }
  };

  // ── Apply all filters (Search, Date, Type) ─────────────────────────
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
    });
  }, [transactions, search, fromDate, toDate, typeFilter]);

  const hasActiveFilters = search || fromDate || toDate || typeFilter !== 'all';
  const clearFilters = () => { setSearch(''); setFromDate(''); setToDate(''); setTypeFilter('all'); setPreset(''); };

  // ── This vs Last month comparison (Raw Data, unfiltered by search) ─
  const now = new Date();
  const thisMonthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonthTxs = transactions.filter(tx => {
    const prev = subMonths(now, 1);
    const d = new Date(tx.date);
    return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
  });

  const thisIncome  = thisMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const lastIncome  = lastMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const thisExpense = thisMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const lastExpense = lastMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const incomePct  = pct(thisIncome, lastIncome);
  const expensePct = pct(thisExpense, lastExpense);

  // ── Chart data (Filtered) ──────────────────────────────────────────
  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const profitLoss   = totalIncome - totalExpense;

  const expByCategory = filtered
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => { acc[tc(t.category)] = (acc[tc(t.category)] || 0) + t.amount; return acc; }, {});
  const pieData = Object.entries(expByCategory).map(([name, value]) => ({ name, value }));

  const trendMap = filtered.reduce((acc, tx) => {
    const d = new Date(tx.date);
    let label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    if (!acc[label]) acc[label] = { name: label, income: 0, expense: 0 };
    if (tx.type === 'income') acc[label].income += tx.amount;
    else acc[label].expense += tx.amount;
    return acc;
  }, {});
  const barData = Object.values(trendMap).sort((a, b) => new Date(a.name) - new Date(b.name));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-darkCard/95 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="font-bold text-gray-200 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatINR(p.value)}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in pb-20">

      {/* ── Sticky Filter Header ──────────────────────────────────────── */}
      <div className={`sticky top-0 z-30 transition-all duration-300 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-b border-[#38240D]/[0.08] dark:border-white/10 flex flex-col ${isScrolled ? 'bg-white/90 dark:bg-slate-900/80 py-2.5 px-4 space-y-2' : 'bg-white dark:bg-slate-900/40 border border-[#38240D]/[0.08] dark:border-white/[0.05] p-3 rounded-2xl shadow-sm space-y-3 m-2'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className={`text-emerald-600 dark:text-neonEmerald transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <h1 className={`font-bold text-slate-900 dark:text-white transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>{t('analytics')}</h1>
          </div>
          <div className="flex items-center gap-3">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#38240D]/50 w-4 h-4" />
            <input type="text" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} className="bg-[#38240D]/[0.02] dark:bg-slate-800 text-[#38240D] dark:text-white border border-[#38240D]/[0.12] dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs font-bold pl-9 w-full outline-none" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#38240D]/50 hover:text-[#38240D]"><X className="w-4 h-4" /></button>}
          </div>
        </div>

        {/* Date + Type row */}
        <div className={`transition-all duration-300 overflow-hidden flex flex-col sm:flex-row gap-2 ${isScrolled ? 'h-0 opacity-0 !mt-0' : 'h-10 sm:h-auto opacity-100'}`}>
          <div className="flex items-center gap-2 flex-1 bg-[#38240D]/[0.02] dark:bg-slate-800 border border-[#38240D]/[0.12] dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-[#38240D]/50" />
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPreset(''); }} className="bg-transparent text-[#38240D] dark:text-white focus:outline-none w-full cursor-pointer" title="From (optional)" placeholder="From" />
          </div>
          <div className="flex items-center gap-2 flex-1 bg-[#38240D]/[0.02] dark:bg-slate-800 border border-[#38240D]/[0.12] dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-[#38240D]/50" />
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPreset(''); }} className="bg-transparent text-[#38240D] dark:text-white focus:outline-none w-full cursor-pointer" title="To (optional)" placeholder="To" />
          </div>
          <div className="flex bg-[#38240D]/[0.02] dark:bg-slate-800 border border-[#38240D]/[0.12] dark:border-white/[0.08] rounded-xl p-1 gap-1">
            {[{ val: 'all', label: isTA ? 'அனைத்தும்' : 'All' }, { val: 'income', label: <TrendingUp className="w-4 h-4" /> }, { val: 'expense', label: <TrendingDown className="w-4 h-4" /> }].map(({ val, label }) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex-shrink-0 ${typeFilter === val ? val === 'income' ? 'bg-[#38240D] text-white border-[#38240D]' : val === 'expense' ? 'bg-[#38240D] text-white border-[#38240D]' : 'bg-[#38240D] text-white border-[#38240D]' : 'text-[#38240D]/60 border-transparent hover:text-[#38240D]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Presets (Always visible, horizontal scroll) */}
        <div className="flex overflow-x-auto scrollbar-hide bg-slate-200/60 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-300/40 dark:border-white/[0.04] items-center w-full">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePresetClick(p.id)}
              className={`whitespace-nowrap flex-1 text-center transition-all flex-shrink-0 ${preset === p.id ? 'bg-white dark:bg-slate-800 text-[#0f172a] dark:text-white font-bold text-xs shadow-[0_2px_10px_rgba(15,23,42,0.06)] py-2 px-4 rounded-lg' : 'text-[#0f172a]/60 dark:text-slate-400 font-bold text-xs py-2 px-4 hover:text-[#0f172a] dark:hover:text-white'}`}
            >
              {isTA ? p.label : p.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-5">
        
        {/* ── Profit/Loss Summary (Filtered) ────────────────────────────── */}
        <div className="bg-white dark:bg-[#1e293b]/50 border border-slate-200/80 dark:border-white/[0.05] p-6 rounded-2xl shadow-sm text-center mt-4">
          <h3 className="text-sm font-bold text-[#0f172a]/70 dark:text-slate-400 mb-2 uppercase tracking-wide">
            {isTA ? 'நிதி நிலைமை' : 'Financial Status'}
          </h3>
          <div className={`text-4xl tracking-tight ${profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-rose-600 dark:text-rose-400 font-extrabold'}`}>
            {formatINR(profitLoss)}
          </div>
          <div className="flex justify-center gap-8 mt-4 text-sm">
            <div className="flex flex-col"><span className="text-[#0f172a]/70 dark:text-slate-400 font-medium">{isTA ? 'வருமானம்' : 'Income'}</span><span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatINR(totalIncome)}</span></div>
            <div className="flex flex-col"><span className="text-[#0f172a]/70 dark:text-slate-400 font-medium">{isTA ? 'செலவு' : 'Expenses'}</span><span className="font-extrabold text-rose-600 dark:text-rose-400">{formatINR(totalExpense)}</span></div>
          </div>
        </div>

        {/* ── Comparative Month View (Always Absolute values) ───────────── */}
        <div className="bg-white dark:bg-[#1e293b]/50 border border-slate-200/80 dark:border-white/[0.05] p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-[#0f172a]/70 dark:text-slate-400 mb-4 uppercase tracking-wide">
            {isTA ? 'இந்த மாதம் vs கடந்த மாதம்' : 'This Month vs Last Month'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[#0f172a] dark:text-slate-100" />
                <span className="text-xs font-medium text-[#0f172a]/70 dark:text-slate-400">{isTA ? 'வருமானம்' : 'Income'}</span>
              </div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatINR(thisIncome)}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 font-bold ${incomePct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {incomePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(incomePct)}% vs {isTA ? 'கடந்த மாதம்' : 'last month'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-[#0f172a] dark:text-slate-100" />
                <span className="text-xs font-medium text-[#0f172a]/70 dark:text-slate-400">{isTA ? 'செலவு' : 'Expense'}</span>
              </div>
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{formatINR(thisExpense)}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 font-bold ${expensePct <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {expensePct <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {Math.abs(expensePct)}% vs {isTA ? 'கடந்த மாதம்' : 'last month'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Income vs Expense Bar Chart ───────────────────────────────── */}
        <div className="bg-white dark:bg-[#1e293b]/50 border border-slate-200/80 dark:border-white/[0.05] shadow-sm p-6 rounded-2xl">
          <h4 className="text-sm text-[#0f172a] dark:text-slate-100 mb-5 text-center font-bold uppercase tracking-wide">
            {isTA ? 'வருமானம் vs செலவு' : 'Income vs Expense'}
          </h4>
          <div className="h-56">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" />
                  <XAxis dataKey="name" stroke="#0f172a" opacity={0.6} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#0f172a" opacity={0.6} fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#0f172a', opacity: 0.8 }} />
                  <Bar dataKey="income" name={isTA ? 'வருமானம்' : 'Income'} fill="#059669" radius={[4,4,0,0]} animationDuration={300} />
                  <Bar dataKey="expense" name={isTA ? 'செலவு' : 'Expense'} fill="#e11d48" radius={[4,4,0,0]} animationDuration={300} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-gray-500 text-sm">{t('noData')}</div>}
          </div>
        </div>

        {/* ── Category Pie ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1e293b]/50 border border-slate-200/80 dark:border-white/[0.05] shadow-sm p-6 rounded-2xl">
          <h4 className="text-sm text-[#0f172a] dark:text-slate-100 mb-5 text-center font-bold uppercase tracking-wide">
            {isTA ? 'வகைவாரி செலவு' : 'Expenses by Category'}
          </h4>
          {pieData.length > 0 ? (
            <>
              <div className="h-56 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none" animationDuration={300}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-400">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{entry.name}</span>
                    <span className="text-gray-500">({formatINR(entry.value)})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center py-12 text-gray-500 text-sm">{t('noData')}</div>}
        </div>
      </div>
    </div>
  );
}
