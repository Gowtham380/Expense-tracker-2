import React, { useState } from 'react';
import Modal from '../components/Modals';
import { useExpense, formatINR, CATEGORIES } from '../context/ExpenseContext';
import {
  PlusCircle, MinusCircle, Flame, Store, Home, ArrowRight,
  CloudLightning, CheckCircle2, AlertTriangle, X, Wallet
} from 'lucide-react';
import FinancialHealth from '../components/FinancialHealth';
import { supabase } from '../supabaseClient';
import AmountInput from '../components/AmountInput';

export default function DashboardPage() {
  const {
    transactions, t, appMode, setAppMode,
    isSyncing, dbSetupRequired, dbConnectionError,
    addExpense, bills, session
  } = useExpense();

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [poojaiAmount, setPoojaiAmount] = useState('100');
  const [dismissedBills, setDismissedBills] = useState(new Set()); // IDs dismissed this session
  const [imgError, setImgError] = useState(false);

  const closeModel = () => setModalState({ type: null, data: null });

  const userMetadata = session?.user?.user_metadata || {};
  const avatarUrl = userMetadata.avatar_url;
  const fullName = userMetadata.full_name || userMetadata.name || session?.user?.email || 'U';
  const initial = fullName.charAt(0).toUpperCase();

  const isFriday = new Date().getDay() === 5;
  const today    = new Date();
  const todayDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear  = today.getFullYear();

  // ── Bill Payment Check ────────────────────────────────────────────────
  // A bill is "paid this month" if there's an expense with matching category in current month
  const isPaidThisMonth = (bill) => transactions.some(tx => {
    if (tx.type !== 'expense') return false;
    const d = new Date(tx.date);
    return (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear &&
      tx.category === bill.category
    );
  });

  // Bills that are due (today >= dueDay) AND not paid AND not dismissed
  const pendingBills = (bills || []).filter(bill => {
    if (bill.amount <= 0) return false;            // skip bills with no amount set
    if (dismissedBills.has(bill.id)) return false; // dismissed this session
    if (isPaidThisMonth(bill)) return false;        // already paid
    return todayDay >= bill.dueDay;                 // due today or overdue
  });

  // ── Today's Profit (Kadai Mode) ───────────────────────────────────────
  const todayTransactions = transactions.filter(tx =>
    new Date(tx.date).toDateString() === today.toDateString()
  );
  const todaySales = todayTransactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const todayKadaiExpenses = todayTransactions
    .filter(tx => tx.type === 'expense' && CATEGORIES.KADAI.includes(tx.category))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const todaysProfit = todaySales - todayKadaiExpenses;

  // ── Poojai Handler ────────────────────────────────────────────────────
  const handlePoojaiSave = () => {
    const amt = parseFloat(poojaiAmount);
    if (!amt || amt <= 0) return;
    addExpense({
      amount: amt,
      category: 'Friday Poojai',
      date: new Date().toISOString(),
      desc: 'Friday Poojai'
    });
    setPoojaiAmount('100');
  };

  // ── Bill Mark as Paid ────────────────────────────────────────────────
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

  return (
    <div className="space-y-6 animate-in fade-in pt-2">

      {/* ── Database Error Banner ─────────────────────────────────────── */}
      {dbSetupRequired && (
        <div className="bg-red-500/10 border-l-4 border-red-500 rounded-lg p-5 flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-red-500 text-lg">Database Setup Required!</h3>
            <p className="text-red-200/80 text-sm mt-1">
              Supabase cannot find your tables. Paste the schema.sql into your Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {dbConnectionError && !dbSetupRequired && (
        <div className="bg-red-500/10 border-l-4 border-red-500 rounded-lg p-5 flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-red-500 text-lg">Connection Offline</h3>
            <p className="text-red-200/80 text-sm mt-1">
              Could not reach Supabase. Check your internet or verify your Supabase keys.
            </p>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="glass-card p-6 flex items-center justify-between">
        <div className="flex flex-row items-center gap-3">
          {avatarUrl && !imgError ? (
            <img src={avatarUrl} alt="Profile" loading="lazy" onError={() => setImgError(true)} className="w-10 h-10 rounded-full border-2 border-white/10 shadow-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg border-2 border-white/10 shadow-lg flex-shrink-0">
              {initial}
            </div>
          )}
          <h1 className="text-lg font-bold text-white">Hello, {fullName}</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-darkBg border border-white/10 text-[10px] font-semibold">
            {isSyncing
              ? <><CloudLightning className="w-3 h-3 text-amber-400 animate-pulse" /> Syncing</>
              : <><CheckCircle2 className="w-3 h-3 text-neonEmerald" /> Synced</>
            }
          </div>
          <button onClick={async () => await supabase.auth.signOut()} className="text-xs font-bold text-neonRose hover:text-white transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Mode Switcher ─────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div className="flex bg-darkCard/80 p-1 border border-white/10 rounded-2xl w-full max-w-sm">
          <button
            onClick={() => setAppMode('kadai')}
            className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${appMode === 'kadai' ? 'bg-neonEmerald/20 text-neonEmerald shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-gray-400 hover:text-white'}`}
          >
            <Store className="w-4 h-4" /> {t('kadaiMode')}
          </button>
          <button
            onClick={() => setAppMode('veedu')}
            className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${appMode === 'veedu' ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:text-white'}`}
          >
            <Home className="w-4 h-4" /> {t('veeduMode')}
          </button>
        </div>
      </div>

      {/* ── Primary Actions ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setModalState({ type: 'income', data: null })}
          className="bg-darkCard/80 border border-neonEmerald/30 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:bg-neonEmerald/10 active:scale-95 transition-all"
          style={{ minHeight: '160px' }}
        >
          <div className="bg-neonEmerald/20 p-4 rounded-full">
            <PlusCircle className="w-10 h-10 text-neonEmerald" />
          </div>
          <span className="font-bold text-lg text-neonEmerald text-center leading-tight">{t('dailySales')}</span>
        </button>

        <button
          onClick={() => setModalState({ type: 'expense', data: null })}
          className="bg-darkCard/80 border border-neonRose/30 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 shadow-[0_8px_30px_rgba(244,63,94,0.15)] hover:bg-neonRose/10 active:scale-95 transition-all"
          style={{ minHeight: '160px' }}
        >
          <div className="bg-neonRose/20 p-4 rounded-full">
            <MinusCircle className="w-10 h-10 text-neonRose" />
          </div>
          <span className="font-bold text-lg text-neonRose text-center leading-tight">{t('expenseTitle')}</span>
        </button>
      </div>

      {/* ── Smart Alerts Section ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* ── Pending Bill Notification Banners ── */}
        {pendingBills.map(bill => {
          const isOverdue = todayDay > bill.dueDay;
          return (
            <div
              key={bill.id}
              className={`rounded-2xl p-4 flex flex-col gap-4 border ${
                isOverdue
                  ? 'bg-red-500/10 border-red-500/40'
                  : 'bg-amber-500/10 border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isOverdue ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                    <Wallet className={`w-5 h-5 ${isOverdue ? 'text-red-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                      {isOverdue ? '⚠️ Overdue:' : '🔔 Due Today:'} {bill.name}
                    </div>
                    <div className={`text-xs ${isOverdue ? 'text-red-200/70' : 'text-amber-200/70'}`}>
                      {formatINR(bill.amount)} • Due on {bill.dueDay}{['st','nd','rd'][bill.dueDay - 1] || 'th'} every month
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDismissBill(bill)} className="text-gray-500 hover:text-white p-1 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkPaid(bill)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${
                    isOverdue
                      ? 'bg-red-500 text-white hover:bg-red-400'
                      : 'bg-amber-500 text-darkBg hover:bg-amber-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark as Paid
                </button>
                <button
                  onClick={() => setModalState({ type: 'expense', data: { category: bill.category, amount: bill.amount } })}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all flex items-center gap-1.5"
                >
                  <ArrowRight className="w-4 h-4" /> Edit
                </button>
              </div>
            </div>
          );
        })}

        {/* ── Interactive Friday Poojai Card ── */}
        {isFriday && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2.5 rounded-xl">
                <Flame className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-bold text-blue-400">🙏 இன்று வெள்ளிக்கிழமை!</div>
                <div className="text-xs text-blue-200/70">உங்கள் பூஜைக்கான தொகையை உள்ளிட்டு சேமிக்கவும்.</div>
              </div>
            </div>
            <div className="flex gap-2">
              <AmountInput
                value={poojaiAmount}
                onChange={e => setPoojaiAmount(e.target.value)}
                className="flex-1 glass-input py-2.5 text-center font-bold text-lg"
                placeholder="₹ தொகை"
              />
              <button
                onClick={handlePoojaiSave}
                className="bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-blue-400 active:scale-95 transition-all text-sm"
              >
                சேமி
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Today's Profit (Kadai Mode) ──────────────────────────────── */}
      {appMode === 'kadai' && !dbSetupRequired && !dbConnectionError && (
        <div className="glass-card p-5 text-center flex flex-col items-center border border-neonEmerald/20 bg-gradient-to-br from-darkCard to-neonEmerald/5">
          <div className="text-sm font-semibold text-gray-400 mb-1">{t('todaysProfit')} {t('kadaiMode')}</div>
          <div className={`text-4xl font-black tracking-tighter ${todaysProfit >= 0 ? 'text-neonEmerald' : 'text-neonRose'}`}>
            {formatINR(todaysProfit)}
          </div>
        </div>
      )}

      {/* ── Financial Health ─────────────────────────────────────────── */}
      {!dbSetupRequired && !dbConnectionError && <FinancialHealth />}

      <Modal
        isOpen={modalState.type !== null}
        onClose={closeModel}
        type={modalState.type}
        initialData={modalState.data}
      />
    </div>
  );
}
