import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { useExpense, formatINR } from '../context/ExpenseContext';
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
  const { transactions, language, t, tc, themeMode } = useExpense();
  const isTA = language === 'ta';
  const isDarkMode = themeMode === 'dark';

  const [search, setSearch]       = useState('');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [preset, setPreset]       = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Auto-populate earliest date to today
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Sort to get the earliest date
      const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstDate = sorted[0].date; // Format: YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      setFromDate(prev => prev || firstDate);
      setToDate(prev => prev || today);
    }
  }, [transactions]);

  // Sticky Scroll Logic
  // const [isScrolled, setIsScrolled] = useState(false);
  // useEffect(() => {
  //   const handleScroll = () => setIsScrolled(window.scrollY > 20);
  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

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
        <p className="font-bold text-slate-200 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatINR(p.value)}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full relative animate-in fade-in pb-20 bg-slate-50 dark:bg-black">

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
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full bg-transparent pl-9 pr-8 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`p-2.5 rounded-xl glass-premium transition-colors shadow-sm ${showFilters ? 'text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* --- COLLAPSIBLE DRAWER --- */}
          {showFilters && (
          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 pb-2">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('analytics')}</h1>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all shadow-sm">
                  <XCircle className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            {/* Date row */}
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full items-center">
              <div className="flex items-center gap-2 flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-sm">
                <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPreset(''); }} className="bg-transparent text-slate-900 dark:text-white focus:outline-none w-full cursor-pointer" title="From" />
              </div>
              <div className="flex items-center gap-2 flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-sm">
                <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPreset(''); }} className="bg-transparent text-slate-900 dark:text-white focus:outline-none w-full cursor-pointer" title="To" />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex bg-white dark:bg-[#1e293b] shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1">
              {[{ val: 'all', label: isTA ? 'அனைத்தும்' : 'All' }, { val: 'income', label: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> }, { val: 'expense', label: <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" /> }].map(({ val, label }) => (
                <button key={val} onClick={() => setTypeFilter(val)}
                  className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                    typeFilter === val 
                      ? val === 'income' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-500/40' 
                      : val === 'expense' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 shadow-sm border border-rose-200 dark:border-rose-500/40'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-slate-800'
                      : 'text-slate-500 border border-transparent hover:text-slate-900 dark:hover:text-white'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Quick Presets */}
            <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1e293b] shadow-sm p-1 rounded-xl border border-slate-200 dark:border-slate-800 items-center w-full">
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => handlePresetClick(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 border ${preset === p.id ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-sm border-emerald-200 dark:border-emerald-500/40' : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'}`}>
                  {isTA ? p.label : p.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── Scrollable Body Content ─────────────────────────────────────── */}
      <div className="w-full px-4 space-y-5 pt-5">
        
        {/* ── Profit/Loss Summary (Filtered) ────────────────────────────── */}
        <div className="premium-card bg-white dark:bg-[#111827] p-6 rounded-2xl text-center mt-4 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
            {isTA ? 'நிதி நிலைமை' : 'Financial Status'}
          </h3>
          <div className={`text-4xl tracking-tight ${profitLoss >= 0 ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}`}>
            {profitLoss > 0 ? '+' : ''}{formatINR(profitLoss)}
          </div>
          <div className="flex justify-center gap-8 mt-4 text-sm">
            <div className="flex flex-col"><span className="text-slate-500 font-medium">{isTA ? 'வருமானம்' : 'Income'}</span><span className="font-extrabold text-emerald-600">{formatINR(totalIncome)}</span></div>
            <div className="flex flex-col"><span className="text-slate-500 font-medium">{isTA ? 'செலவு' : 'Expenses'}</span><span className="font-extrabold text-rose-600">{formatINR(totalExpense)}</span></div>
          </div>
        </div>

        {/* ── Comparative Month View (Always Absolute values) ───────────── */}
        <div className="premium-card bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
            {isTA ? 'இந்த மாதம் vs கடந்த மாதம்' : 'This Month vs Last Month'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-slate-900 dark:text-slate-300" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isTA ? 'வருமானம்' : 'Income'}</span>
              </div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatINR(thisIncome)}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 font-bold ${incomePct >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {incomePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(incomePct)}% vs {isTA ? 'கடந்த மாதம்' : 'last month'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-slate-900 dark:text-slate-300" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isTA ? 'செலவு' : 'Expense'}</span>
              </div>
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{formatINR(thisExpense)}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 font-bold ${expensePct <= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {expensePct <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {Math.abs(expensePct)}% vs {isTA ? 'கடந்த மாதம்' : 'last month'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Income vs Expense Bar Chart ───────────────────────────────── */}
        <div className="premium-card bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none">
          <h4 className="text-sm text-slate-900 dark:text-white mb-5 text-center font-bold uppercase tracking-wide">
            {isTA ? 'வருமானம் vs செலவு' : 'Income vs Expense'}
          </h4>
          <div className="w-full h-[250px] min-h-[250px] overflow-hidden">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)"} />
                  <XAxis dataKey="name" stroke={isDarkMode ? "#94a3b8" : "#475569"} opacity={0.6} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#475569"} opacity={0.6} fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: isDarkMode ? '#94a3b8' : '#0f172a', opacity: 0.8 }} />
                  <Bar dataKey="income" name={isTA ? 'வருமானம்' : 'Income'} fill="#10b981" radius={[4,4,0,0]} animationDuration={300} />
                  <Bar dataKey="expense" name={isTA ? 'செலவு' : 'Expense'} fill="#f43f5e" radius={[4,4,0,0]} animationDuration={300} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-500 text-sm">{t('noData')}</div>}
          </div>
        </div>

        {/* ── Category Pie ─────────────────────────────────────────────── */}
        <div className="premium-card bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none">
          <h4 className="text-sm text-slate-900 dark:text-white mb-5 text-center font-bold uppercase tracking-wide">
            {isTA ? 'வகைவாரி செலவு' : 'Expenses by Category'}
          </h4>
          {pieData.length > 0 ? (
            <>
              <div className="w-full h-[250px] min-h-[250px] mb-4 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none" animationDuration={300}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-600 font-medium">{entry.name}</span>
                    <span className="text-slate-400">({formatINR(entry.value)})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center py-12 text-slate-500 text-sm">{t('noData')}</div>}
        </div>
      </div>
    </div>
  );
}
