import React, { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modals';
import { useExpense, formatINR } from '../context/ExpenseContext';
import {
  Plus, Minus, TrendingUp, TrendingDown,
  CloudLightning, CheckCircle2, AlertTriangle, X, Wallet, RefreshCcw, Activity
} from 'lucide-react';
import FinancialHealth from '../components/FinancialHealth';

// ── Smart Infinite Metrics Ticker Component ─────────────────────────────────
function TickerMetrics({ todayIncome, todayExpenses, netProfit, incomeGrowth, expenseGrowth, t, language }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const metricsData = [
    {
      title: t('daily_sales'),
      value: formatINR(todayIncome),
      detailText: 'VS. YESTERDAY',
      borderTopClass: 'border-t-[#00d40e]',
      bgGlowClass: 'bg-[#38240D]/5 group-hover:bg-[#38240D]/10',
      icon: (
        <span className={`flex items-center font-bold ${incomeGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {incomeGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {Math.abs(incomeGrowth)}%
        </span>
      )
    },
    {
      title: t('daily_expenses'),
      value: formatINR(todayExpenses),
      detailText: 'VS. YESTERDAY',
      borderTopClass: 'border-t-[#fc0307]',
      bgGlowClass: 'bg-[#38240D]/5 group-hover:bg-[#38240D]/10',
      icon: (
        <span className={`flex items-center font-bold ${expenseGrowth <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {expenseGrowth <= 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1" />}
          {Math.abs(expenseGrowth)}%
        </span>
      )
    },
    {
      title: t('net_profit'),
      value: formatINR(netProfit),
      detailText: 'LIVE CALCULATED',
      borderTopClass: 'border-t-[#38240D]',
      bgGlowClass: 'bg-[#38240D]/5 group-hover:bg-[#38240D]/10',
      icon: <Activity className="w-4 h-4 text-[#38240D]/80" />
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % 3;
        if (scrollRef.current) {
          const childWidth = scrollRef.current.clientWidth;
          scrollRef.current.scrollTo({ left: nextIndex * childWidth, behavior: 'smooth' });
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const childWidth = scrollRef.current.clientWidth;
      const index = Math.round(scrollLeft / childWidth);
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  };

  const scrollToIdx = (idx) => {
    setActiveIndex(idx);
    if (scrollRef.current) {
      const childWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: idx * childWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full md:max-w-4xl lg:max-w-5xl mx-auto rounded-[20px] mb-2 px-2 md:px-0">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none gap-4 w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {metricsData.map((metric, idx) => {
          const isPositiveNet = netProfit >= 0;
          const bgClasses = idx === 0 
            ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] border border-emerald-500/20 dark:border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.03)]' 
            : idx === 1 
            ? 'bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border border-rose-500/20 dark:border-rose-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.03)]' 
            : 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05] border border-blue-500/20 dark:border-blue-500/30 shadow-[0_8px_32px_rgba(59,130,246,0.03)]';
            
          const textClasses = idx === 0 
            ? 'text-emerald-600 dark:text-emerald-400 font-black' 
            : idx === 1 
            ? 'text-rose-600 dark:text-rose-400 font-black' 
            : (isPositiveNet ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-rose-600 dark:text-rose-400 font-extrabold');

          return (
            <div key={idx} className="w-full shrink-0 snap-center">
              <div className={`${bgClasses} p-4 md:p-6 lg:p-10 relative overflow-hidden group h-[200px] md:h-[240px] flex flex-col justify-center rounded-2xl backdrop-blur-md`}>
                <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl transition-all duration-700 ${metric.bgGlowClass}`}></div>
                <h3 className={`text-xs md:text-sm font-bold text-[#0f172a]/70 dark:text-slate-400 mb-2 md:mb-3 ${language === 'ta' ? 'tracking-normal leading-relaxed' : 'tracking-widest uppercase'}`}>{metric.title}</h3>
                <div className={`text-3xl md:text-5xl lg:text-6xl ${textClasses} font-sans tracking-tight mb-3 md:mb-5 select-none`}>
                  {metric.value}
                </div>
                <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#0f172a]/70 dark:text-slate-400">
                  {metric.icon}
                  <span className="tracking-wider uppercase ml-1">{metric.detailText}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Pagination indicators */}
      <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center gap-2 pb-2">
        {metricsData.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => scrollToIdx(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    transactions, t, tc,
    isSyncing, dbSetupRequired, dbConnectionError,
    addExpense, bills, language
  } = useExpense();

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [dismissedBills, setDismissedBills] = useState(new Set());

  const closeModel = () => setModalState({ type: null, data: null });
  const today    = new Date();
  const todayDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear  = today.getFullYear();

  // ── Bill Payment Check ────────────────────────────────────────────────
  const isPaidThisMonth = (bill) => transactions.some(tx => {
    if (tx.type !== 'expense') return false;
    const d = new Date(tx.date);
    return (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear &&
      tx.category === bill.category
    );
  });

  const pendingBills = (bills || []).filter(bill => {
    if (bill.amount <= 0) return false;
    if (dismissedBills.has(bill.id)) return false;
    if (isPaidThisMonth(bill)) return false;
    return todayDay >= bill.dueDay;
  });

  // ── Metrics Calculation ───────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const incomeTxs = transactions.filter(t => t.type === 'income');
  const expenseTxs = transactions.filter(t => t.type === 'expense');

  // Helper to sum by date
  const sumByDate = (dataArray, startDate, endDate) => {
    return dataArray
      .filter(item => {
        const d = new Date(item.date);
        return d >= startDate && (!endDate || d < endDate);
      })
      .reduce((sum, item) => sum + Number(item.amount), 0);
  };

  const todayIncome = sumByDate(incomeTxs, todayStart);
  const yesterdayIncome = sumByDate(incomeTxs, yesterdayStart, todayStart);

  const todayExpenses = sumByDate(expenseTxs, todayStart);
  const yesterdayExpensesAmt = sumByDate(expenseTxs, yesterdayStart, todayStart);

  const netProfit = todayIncome - todayExpenses;

  // Safe percentage calculation engine
  const calculateTrend = (today, yesterday) => {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return Math.round(((today - yesterday) / yesterday) * 100);
  };

  const incomeGrowth = calculateTrend(todayIncome, yesterdayIncome);
  const expenseGrowth = calculateTrend(todayExpenses, yesterdayExpensesAmt);

  // ── Handlers ────────────────────────────────────────────────────
  const handleMarkPaid = (bill) => {
    addExpense({
      amount: bill.amount,
      category: bill.category,
      date: new Date().toISOString(),
      desc: `${bill.name} - ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`
    });
  };

  const handleDismissBill = (bill) => {
    setDismissedBills(prev => new Set([...prev, bill.id]));
  };

  // ── Recent Transactions (Constrained Ledger) ──────────────────────────
  const dashboardFinalFeed = (() => {
    const sortedData = transactions || [];
    
    // Calculate midnight of yesterday
    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    // Filter transactions to keep only Today and Yesterday
    const recentOnly = sortedData.filter(item => {
      if (!item.date) return false;
      const txDate = new Date(item.date);
      return txDate >= startOfYesterday;
    });

    // Sort descending by date and limit the count to top 5
    return recentOnly
      .sort((a, b) => new Date(b.created_at || `${b.date}T00:00:00`).getTime() - new Date(a.created_at || `${a.date}T00:00:00`).getTime())
      .slice();
  })();

  return (
    <div className="space-y-10 animate-in fade-in pt-6 pb-24 px-2 md:px-6 bg-slate-50 dark:bg-[#0f172a] min-h-screen transition-colors duration-300">

      {/* ── Brand Header ────────────────────────────────────────────────── */}
      <header className="px-2 md:max-w-4xl lg:max-w-5xl md:mx-auto">
        <div className="bg-white dark:bg-[#1e293b]/50 border border-slate-200/80 dark:border-white/[0.05] shadow-[0_8px_30px_rgba(15,23,42,0.02)] dark:shadow-none p-4 rounded-2xl flex items-center justify-between">
          <h1 className="text-[#0f172a] dark:text-white font-black text-base uppercase tracking-widest">
            EXPENZA
          </h1>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05]">
            {isSyncing ? (
              <RefreshCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 spin-fast" />
            ) : (
              <CloudLightning className="w-4 h-4 text-[#0f172a]/70 dark:text-slate-400" />
            )}
          </div>
        </div>
      </header>

      {/* ── Error Banners ─────────────────────────────────────── */}
      {dbSetupRequired && (
        <div className="bg-red-500/10 border-l-4 border-red-500 rounded-2xl p-5 flex items-start gap-4 mx-2 md:max-w-4xl lg:max-w-5xl md:mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-red-500 text-lg">Database Setup Required!</h3>
            <p className="text-red-200/80 text-sm mt-1">Supabase cannot find your tables. Paste the schema.sql into your Supabase SQL Editor.</p>
          </div>
        </div>
      )}

      {/* ── Infinite Scrolling Ticker Engine ─────────────────────────── */}
      <TickerMetrics 
        todayIncome={todayIncome}
        todayExpenses={todayExpenses}
        netProfit={netProfit}
        incomeGrowth={incomeGrowth}
        expenseGrowth={expenseGrowth}
        t={t}
        language={language}
      />

      {/* ── Primary Action Floating Buttons ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-5 px-2 md:max-w-4xl lg:max-w-5xl md:mx-auto">
        <button
          onClick={() => setModalState({ type: 'income', data: null })}
          className="bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 font-bold text-sm py-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200"
        >
          <div className="flex items-center justify-center bg-white dark:bg-emerald-500/10 p-2 rounded-full shadow-sm">
            <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </div>
          <span className={`font-bold text-sm mt-1 ${language === 'ta' ? 'tracking-normal leading-relaxed' : 'tracking-wide'}`}>{t('add_income')}</span>
        </button>

        <button
          onClick={() => setModalState({ type: 'expense', data: null })}
          className="bg-rose-50 hover:bg-rose-100/80 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20 font-bold text-sm py-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200"
        >
          <div className="flex items-center justify-center bg-white dark:bg-rose-500/10 p-2 rounded-full shadow-sm">
            <Minus className="w-6 h-6 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
          </div>
          <span className={`font-bold text-sm mt-1 ${language === 'ta' ? 'tracking-normal leading-relaxed' : 'tracking-wide'}`}>{t('add_expense')}</span>
        </button>
      </div>

      {/* ── Smart Alerts Section ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 px-2 md:max-w-4xl lg:max-w-5xl md:mx-auto">
        {pendingBills.map(bill => {
          const isOverdue = todayDay > bill.dueDay;
          return (
            <div key={bill.id} className={`glass-card p-5 border ${isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className={`font-bold tracking-wide ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                      {isOverdue ? 'OVERDUE' : 'DUE TODAY'}: {bill.name.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {formatINR(bill.amount)} • Auto-reminder
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDismissBill(bill)} className="text-gray-500 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleMarkPaid(bill)} className={`flex-1 py-4 rounded-[20px] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all ${isOverdue ? 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-amber-500 text-darkBg hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}>
                  <CheckCircle2 className="w-4 h-4" /> MARK AS PAID
                </button>
              </div>
            </div>
          );
        })}

      </div>

      {/* ── Recent Transactions (Constrained Height & Overflow) ────────── */}
      <div className="bg-white dark:bg-[#1e293b]/10 border border-slate-200/80 dark:border-white/[0.05] rounded-3xl p-5 flex flex-col h-[380px] overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.015)] md:max-w-2xl lg:max-w-5xl md:mx-auto">
        <h2 className={`text-sm font-bold text-gray-400 mb-4 ml-1 ${language === 'ta' ? 'tracking-normal leading-relaxed' : 'tracking-widest uppercase'}`}>{t('recent_activity')}</h2>
        
        {/* The Height Constraint Matrix */}
        <div className="w-full max-h-[380px] overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200/60 dark:scrollbar-thumb-white/[0.05]">
          {dashboardFinalFeed.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm glass-card h-full flex items-center justify-center">No recent activity.</div>
          ) : (
            dashboardFinalFeed.map((tx, idx) => {
              const isIncome = tx.type === 'income';
              const isToday = new Date(tx.date).toDateString() === today.toDateString();
              const timeStr = new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = isToday ? `Today, ${timeStr}` : `${new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${timeStr}`;
              
              return (
                <div key={tx.id} 
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] rounded-xl select-none cursor-default"
                  style={{ '--row-index': idx }}
                >
                  {/* Left Side: Description & Timestamp */}
                  <div className="flex flex-col min-w-0 flex-1 pr-4">
                    <div className={`font-sans font-bold text-sm text-[#0f172a] dark:text-slate-100 truncate tracking-tight ${language === 'ta' ? 'leading-relaxed tracking-normal' : ''}`}>{tx.desc || tc(tx.category)}</div>
                    <div className="text-xs text-[#0f172a]/70 dark:text-slate-400 font-semibold mt-1">{dateStr}</div>
                  </div>

                  {/* Center: Subtle Badge */}
                  <div className={`hidden sm:flex shrink-0 px-3 py-1 rounded-lg bg-slate-100/80 dark:bg-white/[0.03] text-[#0f172a]/70 dark:text-slate-400 text-[11px] font-bold mr-4 ${language === 'ta' ? 'tracking-normal leading-relaxed' : 'tracking-widest uppercase'}`}>
                    [{tc(tx.category)}]
                  </div>

                  {/* Right Side: Luminous Amount */}
                  <div className={`text-xl md:text-2xl font-extrabold font-sans flex-shrink-0 tracking-tight ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Financial Health ─────────────────────────────────────────── */}
      {!dbSetupRequired && !dbConnectionError && (
        <div className="px-2 md:max-w-4xl lg:max-w-5xl md:mx-auto">
          <FinancialHealth />
        </div>
      )}

      <Modal
        isOpen={modalState.type !== null}
        onClose={closeModel}
        type={modalState.type}
        initialData={modalState.data}
      />
    </div>
  );
}
