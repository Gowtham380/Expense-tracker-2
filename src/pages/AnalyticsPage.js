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
  const { transactions, appMode, language, t, tc } = useExpense();
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
  const isKadai = appMode === 'kadai';
  const targetExpenses = isKadai ? CATEGORIES.KADAI : CATEGORIES.VEEDU;

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense' && targetExpenses.includes(t.category)).reduce((s, t) => s + t.amount, 0);
  const profitLoss   = totalIncome - totalExpense;

  const expByCategory = filtered
    .filter(t => t.type === 'expense' && targetExpenses.includes(t.category))
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
      <div className={`sticky top-0 z-30 transition-all duration-300 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-b border-white/10 flex flex-col ${isScrolled ? 'bg-darkCard/80 py-2.5 px-4 space-y-2' : 'glass-card p-4 space-y-3'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className={`text-neonEmerald transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <h1 className={`font-bold transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>{t('analytics')}</h1>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} className="glass-input pl-9 w-full py-2 text-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
        </div>

        {/* Date + Type row */}
        <div className={`transition-all duration-300 overflow-hidden flex flex-col sm:flex-row gap-2 ${isScrolled ? 'h-0 opacity-0 !mt-0' : 'h-10 sm:h-auto opacity-100'}`}>
          <div className="flex items-center gap-2 flex-1 bg-darkBg/50 border border-white/10 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPreset(''); }} className="bg-transparent text-sm text-white focus:outline-none w-full cursor-pointer" title="From (optional)" placeholder="From" />
          </div>
          <div className="flex items-center gap-2 flex-1 bg-darkBg/50 border border-white/10 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPreset(''); }} className="bg-transparent text-sm text-white focus:outline-none w-full cursor-pointer" title="To (optional)" placeholder="To" />
          </div>
          <div className="flex bg-darkBg/50 border border-white/10 rounded-xl p-1 gap-1">
            {[{ val: 'all', label: isTA ? 'அனைத்தும்' : 'All' }, { val: 'income', label: <TrendingUp className="w-4 h-4" /> }, { val: 'expense', label: <TrendingDown className="w-4 h-4" /> }].map(({ val, label }) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex-shrink-0 ${typeFilter === val ? val === 'income' ? 'bg-neonEmerald/20 text-neonEmerald border-neonEmerald/40' : val === 'expense' ? 'bg-neonRose/20 text-neonRose border-neonRose/40' : 'bg-white/10 text-white border-white/20' : 'text-gray-500 border-white/5 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Presets (Always visible, horizontal scroll) */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePresetClick(p.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${preset === p.id ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'text-gray-400 hover:text-white bg-white/5 border border-white/10'}`}
            >
              {isTA ? p.label : p.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-5">
        
        {/* ── Profit/Loss Summary (Filtered) ────────────────────────────── */}
        <div className="glass-card p-6 text-center border border-indigo-500/20 bg-gradient-to-br from-darkCard to-indigo-500/5 mt-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            {isTA ? 'நிதி நிலைமை' : 'Financial Status'}
          </h3>
          <div className={`text-4xl font-black tracking-tight ${profitLoss >= 0 ? 'text-neonEmerald' : 'text-neonRose'}`}>
            {formatINR(profitLoss)}
          </div>
          <div className="flex justify-center gap-8 mt-4 text-sm">
            <div className="flex flex-col"><span className="text-gray-500">{isTA ? 'வருமானம்' : 'Income'}</span><span className="font-bold text-neonEmerald">{formatINR(totalIncome)}</span></div>
            <div className="flex flex-col"><span className="text-gray-500">{isTA ? 'செலவு' : 'Expenses'}</span><span className="font-bold text-neonRose">{formatINR(totalExpense)}</span></div>
          </div>
        </div>

        {/* ── Comparative Month View (Always Absolute values) ───────────── */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wide">
            {isTA ? 'இந்த மாதம் vs கடந்த மாதம்' : 'This Month vs Last Month'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neonEmerald/5 border border-neonEmerald/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-neonEmerald" />
                <span className="text-xs text-gray-400">{isTA ? 'வருமானம்' : 'Income'}</span>
              </div>
              <div className="text-xl font-black text-neonEmerald">{formatINR(thisIncome)}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 font-semibold ${incomePct >= 0 ? 'text-neonEmerald' : 'text-neonRose'}`}>
                {incomePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(incomePct)}% vs {isTA ? 'கடந்த மாதம்' : 'last month'}
              </div>
            </div>
            <div className="bg-neonRose/5 border border-neonRose/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-neonRose" />
                <span className="text-xs text-gray-400">{isTA ? 'செலவு' : 'Expense'}</span>
              </div>
              <div className="text-xl font-black text-neonRose">{formatINR(thisExpense)}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 font-semibold ${expensePct <= 0 ? 'text-neonEmerald' : 'text-neonRose'}`}>
                {expensePct <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {Math.abs(expensePct)}% vs {isTA ? 'கடந்த மாதம்' : 'last month'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Income vs Expense Bar Chart ───────────────────────────────── */}
        <div className="glass-card p-5">
          <h4 className="text-sm text-gray-400 mb-5 text-center font-semibold uppercase tracking-wide">
            {isTA ? 'வருமானம் vs செலவு' : 'Income vs Expense'}
          </h4>
          <div className="h-56">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Bar dataKey="income" name={isTA ? 'வருமானம்' : 'Income'} fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name={isTA ? 'செலவு' : 'Expense'} fill="#f43f5e" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-gray-500 text-sm">{t('noData')}</div>}
          </div>
        </div>

        {/* ── Category Pie ─────────────────────────────────────────────── */}
        <div className="glass-card p-5">
          <h4 className="text-sm text-gray-400 mb-5 text-center font-semibold uppercase tracking-wide">
            {isTA ? 'வகைவாரி செலவு' : 'Expenses by Category'}
          </h4>
          {pieData.length > 0 ? (
            <>
              <div className="h-56 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
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
