import React, { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modals';
import { useExpense, formatINR } from '../context/ExpenseContext';
import { showToast } from '../utils/toast';
import {
  Plus, Minus, TrendingUp, TrendingDown,
  CloudLightning, CheckCircle2, AlertTriangle, X, Wallet, RefreshCcw, Activity, Sparkles
} from 'lucide-react';
import FinancialHealth from '../components/FinancialHealth';

// ── Smart Infinite Metrics Ticker Component ─────────────────────────────────
function TickerMetrics({ userProfile, transactions }) {
  const { t, language } = useExpense();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const calculateData = () => {
    const freq = userProfile?.frequency || 'monthly';
    const now = new Date();
    let currentStart, currentEnd, prevStart, prevEnd;

    if (freq === 'daily') {
      currentStart = new Date(now);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = null;

      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(currentStart);
    } else if (freq === 'weekly') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // start on Monday
      currentStart = new Date(now);
      currentStart.setDate(diff);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = null;

      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentStart);
    } else { // monthly
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      currentEnd = null;

      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const incomeTxs = (transactions || []).filter(t => t.type === 'income');
    const expenseTxs = (transactions || []).filter(t => t.type === 'expense');

    const sumByDate = (dataArray, startDate, endDate) => {
      return dataArray
        .filter(item => {
          const d = new Date(item.date);
          return d >= startDate && (!endDate || d < endDate);
        })
        .reduce((sum, item) => sum + Number(item.amount), 0);
    };

    const income = sumByDate(incomeTxs, currentStart, currentEnd);
    const prevIncome = sumByDate(incomeTxs, prevStart, prevEnd);

    const expenses = sumByDate(expenseTxs, currentStart, currentEnd);
    const prevExpenses = sumByDate(expenseTxs, prevStart, prevEnd);

    const netProfit = income - expenses;

    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const incomeGrowth = calculateTrend(income, prevIncome);
    const expenseGrowth = calculateTrend(expenses, prevExpenses);

    return { income, expenses, netProfit, incomeGrowth, expenseGrowth, freq };
  };

  const { income, expenses, netProfit, incomeGrowth, expenseGrowth, freq } = calculateData();

  const salesKey = `${freq}_sales`;
  const expensesKey = `${freq}_expenses`;
  
  const comparisonKey = freq === 'daily' 
    ? 'vs_yesterday' 
    : freq === 'weekly' 
    ? 'vs_last_week' 
    : 'vs_last_month';

  const metricsData = [
    {
      title: t(salesKey),
      value: formatINR(income),
      detailText: t(comparisonKey),
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
      title: t(expensesKey),
      value: formatINR(expenses),
      detailText: t(comparisonKey),
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
      value: (netProfit > 0 ? '+' : '') + formatINR(netProfit),
      detailText: t('live_calculated'),
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
            ? 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none' 
            : idx === 1 
            ? 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none' 
            : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none !shadow-none';
            
          const textClasses = idx === 0 
            ? 'text-emerald-600 font-black' 
            : idx === 1 
            ? 'text-rose-600 font-black' 
            : (isPositiveNet ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold');

          return (
            <div key={idx} className="w-full shrink-0 snap-center">
              <div className={`${bgClasses} p-4 md:p-6 lg:p-10 relative overflow-hidden group h-[200px] md:h-[240px] flex flex-col justify-center rounded-2xl backdrop-blur-md`}>
                <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl transition-all duration-700 ${metric.bgGlowClass}`}></div>
                <h3 className={`text-xs md:text-sm font-bold text-slate-500 mb-2 md:mb-3 ${language === 'ta' ? 'tracking-normal leading-relaxed' : 'tracking-widest uppercase'}`}>{metric.title}</h3>
                <div className={`text-2xl md:text-4xl lg:text-5xl ${textClasses} font-sans tracking-tight mb-3 md:mb-5 select-none truncate max-w-full block`} title={metric.value}>
                  {metric.value}
                </div>
                <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-slate-400">
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
            className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-6 bg-slate-400' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
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
    addExpense, bills, language, userProfile,
    deferredPrompt, setDeferredPrompt
  } = useExpense();

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [dismissedBills, setDismissedBills] = useState(new Set());
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (deferredPrompt && !isStandalone) {
      setShowInstallBanner(true);
    } else {
      setShowInstallBanner(false);
    }
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      showToast(
        language === 'ta' 
          ? 'இந்த உலாவியில் நிறுவல் ஆதரவு இல்லை. Chrome/Edge விருப்பங்களைப் பயன்படுத்தவும்.' 
          : 'Installation prompt not supported by this browser. Try Chrome/Edge menu options.', 
        'info'
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

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
    <div className="w-full h-full min-h-screen bg-slate-50 dark:bg-black transition-colors duration-300">

      <div className="sticky top-0 z-[50] pt-2">
        <div className="w-full px-4 pt-4 pb-2 !border-none !ring-0 !shadow-none md:max-w-4xl lg:max-w-5xl md:mx-auto">
          <div className="relative overflow-hidden glass-premium rounded-2xl p-4 shadow-2xl transition-colors duration-300">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-rose-500/20 blur-xl opacity-50"></div>
            <div className="relative z-10 flex items-center justify-between">
              <h1 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-widest">
                EXPENZA
              </h1>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                {isSyncing ? (
                  <RefreshCcw className="w-4 h-4 text-emerald-600 spin-fast" />
                ) : (
                  <CloudLightning className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Wrapper ─────────────────────────────────────── */}
      <div className="px-4 pb-24 space-y-6 animate-in fade-in">

        {/* PWA Install Banner */}
        {showInstallBanner && (
          <div className="glass-premium p-4 rounded-2xl flex justify-between items-center shadow-lg border border-slate-200 dark:border-white/10 relative overflow-hidden animate-in slide-in-from-top-5 duration-300 md:max-w-4xl lg:max-w-5xl md:mx-auto">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'ta' ? 'Expenza-ஐ முகப்புத் திரையில் சேர்க்கவா?' : 'Add Expenza to Home Screen?'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'ta' ? 'வேகமான அணுகல் மற்றும் ஆஃப்லைன் பயன்பாடு' : 'Fast access, offline-ready & mobile native feel'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 relative z-10">
              <button 
                onClick={() => setShowInstallBanner(false)} 
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {language === 'ta' ? 'நீக்கு' : 'Dismiss'}
              </button>
              <button 
                onClick={handleInstall} 
                className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
              >
                {language === 'ta' ? 'நிறுவு' : 'Install'}
              </button>
            </div>
          </div>
        )}

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
        userProfile={userProfile}
        transactions={transactions}
      />

      {/* ── Primary Action Floating Buttons ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-5 px-2 md:max-w-4xl lg:max-w-5xl md:mx-auto">
        <button
          onClick={() => setModalState({ type: 'income', data: null })}
          className="bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-bold text-sm py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
        >
          <div className="flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-full">
            <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </div>
          <span className={`font-extrabold text-sm mt-1 ${language === 'ta' ? 'tracking-normal leading-relaxed' : 'tracking-wide'}`}>{t('add_income')}</span>
        </button>

        <button
          onClick={() => setModalState({ type: 'expense', data: null })}
          className="bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-bold text-sm py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
        >
          <div className="flex items-center justify-center bg-rose-100 dark:bg-rose-500/20 p-2 rounded-full">
            <Minus className="w-6 h-6 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
          </div>
          <span className={`font-extrabold text-sm mt-1 ${language === 'ta' ? 'tracking-normal leading-relaxed' : 'tracking-wide'}`}>{t('add_expense')}</span>
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
                    <div className="text-sm text-slate-400 mt-0.5">
                      due {new Date(bill.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDismissBill(bill)} className="text-slate-500 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
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
      {dashboardFinalFeed.length > 0 && (
        <div className="premium-card bg-white dark:bg-[#111827] rounded-3xl p-5 flex flex-col min-h-[100px] max-h-[400px] overflow-hidden shadow-sm dark:shadow-none !shadow-none md:max-w-2xl lg:max-w-5xl md:mx-auto">
          <h2 className={`text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 ml-1 ${language === 'ta' ? 'tracking-normal leading-relaxed' : 'tracking-widest uppercase'}`}>{t('recent_activity')}</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 p-1 custom-scrollbar">
            {dashboardFinalFeed.slice(0, 4).map((tx, idx) => {
              const isIncome = tx.type === 'income';
              const isToday = new Date(tx.date).toDateString() === today.toDateString();
              const timeStr = new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = isToday ? `Today, ${timeStr}` : `${new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${timeStr}`;
              
              return (
                <div key={tx.id} 
                  className={`flex items-center justify-between p-4 premium-card border-l-4 rounded-xl select-none cursor-default ${
                    isIncome ? 'border-l-emerald-500' : 'border-l-rose-500'
                  }`}
                  style={{ '--row-index': idx }}
                >
                  {/* Left Side: Description & Timestamp */}
                  <div className="flex flex-col min-w-0 flex-1 pr-4">
                    <div className={`font-sans font-bold text-sm text-slate-900 dark:text-white truncate tracking-tight ${language === 'ta' ? 'leading-relaxed tracking-normal' : ''}`}>
                      {tx.desc?.includes('Automated') ? `${tc(tx.category).toUpperCase()}: AUTOMATED ENTRY` : (tx.desc || tc(tx.category))}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">{dateStr}</div>
                  </div>

                  {/* Right Side: Luminous Amount */}
                  <div className={`text-xl md:text-2xl font-extrabold font-sans flex-shrink-0 tracking-tight ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Financial Health ─────────────────────────────────────────── */}
      {!dbSetupRequired && !dbConnectionError && (
        <div className="px-2 md:max-w-4xl lg:max-w-5xl md:mx-auto mt-4">
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
    </div>
  );
}
