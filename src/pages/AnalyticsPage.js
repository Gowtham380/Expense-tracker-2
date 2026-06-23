/**
 * @file AnalyticsPage.js
 * @description Provides financial visualization and multi-point filtering logic.
 * @architectural_note: Utilizes Atomic Dispatcher pattern for filter state.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

function pct(current, prev) {
  if (!prev) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

/**
 * Formats a date object or string into YYYY-MM-DD format.
 * Timezone-safe normalization is required to align input pickers with local days.
 */
const getLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function AnalyticsPage() {
  const { transactions, language, t, tc, themeMode } = useExpense();
  const isTA = language === 'ta';
  const isDarkMode = themeMode === 'dark';

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('expense_analytics_filters');
    return saved ? JSON.parse(saved) : {
      search: '',
      fromDate: '',
      toDate: '',
      type: 'all', // 'all', 'income', 'expense'
      preset: 'all' // 'all', 'month', 'prev', 'year'
    };
  });

  useEffect(() => {
    localStorage.setItem('expense_analytics_filters', JSON.stringify(filters));
  }, [filters]);

  const filtered = useMemo(() => {
    if (!transactions) return [];

    const from = filters.fromDate ? new Date(filters.fromDate + 'T00:00:00').getTime() : 0;
    const to = filters.toDate ? new Date(filters.toDate + 'T23:59:59').getTime() : Date.now();
    const q = filters.search.toLowerCase();

    return transactions.filter(tx => {
      const txTime = new Date(tx.date).getTime();
      const matchesType = filters.type === 'all' || tx.type.toLowerCase() === filters.type.toLowerCase();
      const matchesDate = txTime >= from && txTime <= to;
      const matchesSearch = !q || (tx.desc || '').toLowerCase().includes(q) || (tx.category || '').toLowerCase().includes(q);
      
      return matchesType && matchesDate && matchesSearch;
    });
  }, [transactions, filters]);

  /**
   * Identifies the earliest transaction date bound and today's date for range boundaries.
   */
  const getEarliestAndToday = useCallback(() => {
    if (!transactions || transactions.length === 0) {
      const todayStr = getLocalDateString(new Date());
      return { earliest: todayStr, today: todayStr };
    }
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const earliest = getLocalDateString(sorted[0].date);
    const today = getLocalDateString(new Date());
    return { earliest, today };
  }, [transactions]);

  /**
   * Automatically initializes from/to date ranges based on available transaction boundaries.
   */
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const { earliest, today } = getEarliestAndToday();
      setFilters(prev => ({
        ...prev,
        fromDate: prev.fromDate || earliest,
        toDate: prev.toDate || today
      }));
    }
  }, [transactions, getEarliestAndToday]);

  const applyFilter = (changes) => {
    setFilters(prev => ({ ...prev, ...changes }));
  };

  /**
   * Centralized preset range dispatcher. Matches relative presets to YYYY-MM-DD boundaries.
   */
  const handlePreset = (presetType) => {
    let range;
    const now = new Date();
    if (presetType === 'month') range = { from: startOfMonth(now), to: endOfMonth(now) };
    if (presetType === 'prev') range = { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
    if (presetType === 'year') range = { from: startOfYear(now), to: endOfYear(now) };
    
    if (range) {
      applyFilter({
        fromDate: getLocalDateString(range.from),
        toDate: getLocalDateString(range.to),
        preset: presetType
      });
    } else {
      const { earliest, today } = getEarliestAndToday();
      applyFilter({
        fromDate: earliest,
        toDate: today,
        preset: 'all'
      });
    }
  };

  /**
   * Resets date filters when changing to 'all' to maintain complete historical views.
   */
  const handleTypeChange = (newType) => {
    if (newType === 'all') {
      const { earliest, today } = getEarliestAndToday();
      setFilters({
        search: '',
        fromDate: earliest,
        toDate: today,
        type: 'all',
        preset: 'all'
      });
    } else {
      setFilters(prev => ({
        ...prev,
        type: newType
      }));
    }
  };

  /**
   * Resets all search queries, date bounds, and type filters to default active parameters.
   */
  const handleReset = () => {
    const { earliest, today } = getEarliestAndToday();
    setFilters({
      search: '',
      fromDate: earliest,
      toDate: today,
      type: 'all',
      preset: 'all'
    });
  };

  const { earliest: earliestDate, today: todayDate } = getEarliestAndToday();
  const hasActiveFilters = !!(filters.search || filters.type !== 'all' || (filters.preset && filters.preset !== 'all') || filters.fromDate !== earliestDate || filters.toDate !== todayDate);

  /**
   * Calculates month-over-month (MoM) metrics comparison between the current and previous month.
   */
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = subMonths(now, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const q = filters.search.toLowerCase();
  const searchAndTypeFilteredTxs = transactions.filter(item => {
    const matchesSearch = !q || (item.desc || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
    const matchesType = filters.type === 'all' || (item.type || '').toLowerCase() === filters.type.toLowerCase();
    return matchesSearch && matchesType;
  });

  const thisMonthTxs = searchAndTypeFilteredTxs.filter(tx => {
    const txLocalDate = getLocalDateString(tx.date).substring(0, 7);
    return txLocalDate === currentMonthStr;
  });
  const lastMonthTxs = searchAndTypeFilteredTxs.filter(tx => {
    const txLocalDate = getLocalDateString(tx.date).substring(0, 7);
    return txLocalDate === prevMonthStr;
  });

  const thisIncome  = thisMonthTxs.filter(t => t.type && t.type.toLowerCase() === 'income').reduce((s, t) => s + t.amount, 0);
  const lastIncome  = lastMonthTxs.filter(t => t.type && t.type.toLowerCase() === 'income').reduce((s, t) => s + t.amount, 0);
  const thisExpense = thisMonthTxs.filter(t => t.type && t.type.toLowerCase() === 'expense').reduce((s, t) => s + t.amount, 0);
  const lastExpense = lastMonthTxs.filter(t => t.type && t.type.toLowerCase() === 'expense').reduce((s, t) => s + t.amount, 0);

  const incomePct  = pct(thisIncome, lastIncome);
  const expensePct = pct(thisExpense, lastExpense);

  /**
   * Aggregates filtered transactions for rendering charts and data tables.
   */
  const totalIncome  = filtered.filter(t => t.type && t.type.toLowerCase() === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type && t.type.toLowerCase() === 'expense').reduce((s, t) => s + t.amount, 0);
  const profitLoss   = totalIncome - totalExpense;

  const expByCategory = filtered
    .filter(t => t.type && t.type.toLowerCase() === 'expense')
    .reduce((acc, t) => { acc[tc(t.category)] = (acc[tc(t.category)] || 0) + t.amount; return acc; }, {});
  const pieData = Object.entries(expByCategory).map(([name, value]) => ({ name, value }));

  const trendMap = filtered.reduce((acc, tx) => {
    const d = new Date(tx.date);
    let label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const sortKey = d.getFullYear() * 12 + d.getMonth();
    if (!acc[label]) acc[label] = { name: label, income: 0, expense: 0, sortKey };
    if (tx.type && tx.type.toLowerCase() === 'income') acc[label].income += tx.amount;
    else if (tx.type && tx.type.toLowerCase() === 'expense') acc[label].expense += tx.amount;
    return acc;
  }, {});
  const barData = Object.values(trendMap).sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div className="w-full relative animate-in fade-in pb-20 bg-slate-50 dark:bg-black">
      {/* Sticky Filter Header Container */}
      <div className="sticky top-0 z-[50] w-full pt-2 px-2 md:max-w-4xl lg:max-w-5xl md:mx-auto">
        <div className="relative glass-premium rounded-2xl p-3 shadow-2xl transition-all duration-300">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-rose-500/20 blur-xl opacity-50 pointer-events-none"></div>
          <div className="flex gap-2 items-center relative z-10">
            <div className="relative flex-1 glass-premium rounded-xl shadow-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('search')} 
                value={filters.search} 
                onChange={e => applyFilter({ search: e.target.value })} 
                className="w-full bg-transparent pl-9 pr-8 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl"
              />
              {filters.search && <button onClick={() => applyFilter({ search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              aria-label="Toggle Filters"
              className={`p-2.5 rounded-xl glass-premium transition-colors shadow-sm ${showFilters ? 'text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* --- COLLAPSIBLE DRAWER --- */}
          {showFilters && (
          <div className="relative z-10 mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 pb-2">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('analytics')}</h1>
              {hasActiveFilters && (
                <button onClick={handleReset} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all shadow-sm">
                  <XCircle className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            {/* 8 Filter Buttons Container - Arranged by History Page Reference */}
            <div className="space-y-2.5 w-full">
              {/* Row 1: Date Range Selection */}
              <div className="flex gap-2 w-full items-center">
                <div className="flex items-center gap-2 flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-sm">
                  <input type="date" value={filters.fromDate} onChange={e => applyFilter({ fromDate: e.target.value, preset: '' })} className="bg-transparent text-slate-900 dark:text-white focus:outline-none w-full cursor-pointer" title="From" />
                </div>
                <div className="flex items-center gap-2 flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-sm">
                  <input type="date" value={filters.toDate} onChange={e => applyFilter({ toDate: e.target.value, preset: '' })} className="bg-transparent text-slate-900 dark:text-white focus:outline-none w-full cursor-pointer" title="To" />
                </div>
              </div>

              {/* Row 2: Type Segmented Filter (All, Income, Expense) */}
              <div className="flex bg-white dark:bg-[#1e293b] shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1 w-full">
                {[
                  { val: 'all', label: isTA ? 'அனைத்தும்' : 'All' },
                  { val: 'income', label: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
                  { val: 'expense', label: <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" /> }
                ].map(({ val, label }) => (
                  <button key={val} onClick={() => handleTypeChange(val)}
                    className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                      filters.type === val 
                        ? val === 'income' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 ring-2 ring-emerald-500 shadow-sm' 
                        : val === 'expense' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 ring-2 ring-rose-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-800 ring-2 ring-emerald-500 shadow-sm'
                        : 'text-slate-500 border border-transparent hover:text-slate-900 dark:hover:text-white'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Row 3: Preset Segmented Filter (This Month, Last Month, Current Year) */}
              <div className="flex bg-white dark:bg-[#1e293b] shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1 w-full">
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => handlePreset(p.id)}
                    className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                      filters.preset === p.id 
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 ring-2 ring-emerald-500 shadow-sm' 
                        : 'text-slate-500 border border-transparent hover:text-slate-900 dark:hover:text-white'
                    }`}>
                    {isTA ? p.label : p.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── Scrollable Body Content ─────────────────────────────────────── */}
      <div className="w-full px-4 space-y-5 pt-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <BarChart3 className="w-10 h-10 opacity-20 text-emerald-600" />
            <p className="font-semibold text-sm">{isTA ? 'தரவு எதுவும் இல்லை' : 'No data found'}</p>
            {hasActiveFilters && (
              <button onClick={handleReset} className="text-xs text-emerald-600 underline">
                {isTA ? 'அனைத்து வடிகட்டிகளையும் நீக்கு' : 'Clear all filters'}
              </button>
            )}
          </div>
        ) : (
          <>
        
        {/* ── Profit/Loss Summary (Filtered) ────────────────────────────── */}
        <div className="premium-card bg-white dark:bg-[#111827] p-6 rounded-2xl text-center mt-4 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
            {t('financial_status')}
          </h3>
          <div className={`text-4xl tracking-tight ${profitLoss >= 0 ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}`}>
            {profitLoss > 0 ? '+' : ''}{formatINR(profitLoss)}
          </div>
          <div className="flex justify-center gap-8 mt-4 text-sm">
            <div className="flex flex-col"><span className="text-slate-500 font-medium">{t('income_label')}</span><span className="font-extrabold text-emerald-600">{formatINR(totalIncome)}</span></div>
            <div className="flex flex-col"><span className="text-slate-500 font-medium">{t('expense_label')}</span><span className="font-extrabold text-rose-600">{formatINR(totalExpense)}</span></div>
          </div>
        </div>

        {/* ── Comparative Month View (Always Absolute values) ───────────── */}
        <div className="premium-card bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
            {t('this_vs_last_month')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-slate-900 dark:text-slate-300" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('income_label')}</span>
              </div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatINR(thisIncome)}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 font-bold ${incomePct >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {incomePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(incomePct)}% vs {t('last_month_short')}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-slate-900 dark:text-slate-300" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('expense_label')}</span>
              </div>
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{formatINR(thisExpense)}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 font-bold ${expensePct <= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {expensePct <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {Math.abs(expensePct)}% vs {t('last_month_short')}
              </div>
            </div>
          </div>
        </div>

        {/* ── Income vs Expense Bar Chart ───────────────────────────────── */}
        <div className="premium-card bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none">
          <h4 className="text-sm text-slate-900 dark:text-white mb-5 text-center font-bold uppercase tracking-wide">
            {t('income_vs_expense')}
          </h4>
          <div className="w-full h-[250px] min-h-[250px] overflow-hidden" style={{ width: '100%', height: 250 }}>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)"} />
                  <XAxis dataKey="name" stroke={isDarkMode ? "#94a3b8" : "#475569"} opacity={0.6} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#475569"} opacity={0.6} fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: isDarkMode ? '#94a3b8' : '#0f172a', opacity: 0.8 }} />
                  <Bar dataKey="income" name={t('income_label')} fill="#10b981" radius={[4,4,0,0]} animationDuration={300} />
                  <Bar dataKey="expense" name={t('expense_label')} fill="#f43f5e" radius={[4,4,0,0]} animationDuration={300} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-500 text-sm">{t('no_data')}</div>}
          </div>
        </div>

        {/* ── Category Pie ─────────────────────────────────────────────── */}
        <div className="premium-card bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none">
          <h4 className="text-sm text-slate-900 dark:text-white mb-5 text-center font-bold uppercase tracking-wide">
            {t('expenses_by_category')}
          </h4>
          {pieData.length > 0 ? (
            <>
              <div className="w-full h-[250px] min-h-[250px] mb-4 overflow-hidden" style={{ width: '100%', height: 250 }}>
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
          ) : <div className="flex items-center justify-center py-12 text-slate-500 text-sm">{t('no_data')}</div>}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

