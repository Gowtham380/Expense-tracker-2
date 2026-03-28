import React, { useState } from 'react';
import { useExpense, CATEGORIES } from '../context/ExpenseContext';
import { Settings, Globe, Bell, LogOut, Database, RefreshCw, CheckCircle2, Plus, Trash2, X, Check, ChevronUp } from 'lucide-react';
import { supabase } from '../supabaseClient';
import AmountInput from '../components/AmountInput';

const BILL_CATEGORIES = [
  'House Rent', 'Shop Rent', 'Water', 'EB', 'Electricity',
  'Bike Fuel', 'Food', 'Others', 'Friday Poojai'
];

export default function SettingsPage() {
  const { language, setLanguage, transactions, categoryBudgets, setCategoryBudget,
          bills, setBills, t, tc, session } = useExpense();

  const [syncLogs, setSyncLogs]         = useState([]);
  const [showAddBill, setShowAddBill]   = useState(false);
  const [showBudgets, setShowBudgets]   = useState(false);
  const [newBill, setNewBill]           = useState({ name: '', amount: '', dueDay: 1, category: 'House Rent' });
  const [imgError, setImgError]         = useState(false);

  const userMetadata = session?.user?.user_metadata || {};
  const avatarUrl = userMetadata.avatar_url;
  const fullName = userMetadata.full_name || userMetadata.name || session?.user?.email || 'U';
  const initial = fullName.charAt(0).toUpperCase();

  const safeTransactions = transactions || [];
  const totalIncome  = safeTransactions.filter(x => x?.type === 'income').reduce((a, b) => a + (b?.amount || 0), 0);
  const totalExpense = safeTransactions.filter(x => x?.type === 'expense').reduce((a, b) => a + (b?.amount || 0), 0);
  const netProfit    = totalIncome - totalExpense;

  const handleLogout = async () => await supabase.auth.signOut();

  /* ── Cloud Debugger ─────────────────────────────────────────────────── */
  const handleTestConnection = async () => {
    setSyncLogs([{ text: 'Testing connection...', type: 'info' }]);
    const { data: { session }, error: authErr } = await supabase.auth.getSession();
    if (authErr) { setSyncLogs(p => [...p, { text: `Auth Error: ${authErr.message}`, type: 'error' }]); return; }
    if (!session?.access_token) { setSyncLogs(p => [...p, { text: 'No active session or Bearer Token!', type: 'error' }]); return; }
    setSyncLogs(p => [...p, { text: 'Session Active! JWT attached natively.', type: 'success' }]);
    const { error } = await supabase.from('sales').select('id').limit(1);
    if (error) setSyncLogs(p => [...p, { text: `RLS/Query Error: ${error.message} (${error.code})`, type: 'error' }]);
    else setSyncLogs(p => [...p, { text: 'Supabase Connection Alive! Data accessed.', type: 'success' }]);
  };

  const handleForceMigration = async () => {
    setSyncLogs([{ text: 'Starting Force Migration...', type: 'info' }]);
    const localSales    = safeTransactions.filter(x => x.type === 'income').map(({ amount, date, desc }) => ({ amount, date, description: desc || '' }));
    const localExpenses = safeTransactions.filter(x => x.type === 'expense').map(({ amount, category, date, desc }) => ({ amount, category: category || 'Others', date, description: desc || '' }));
    setSyncLogs(p => [...p, { text: `Found ${localSales.length} sales and ${localExpenses.length} expenses.`, type: 'info' }]);
    if (localSales.length > 0) {
      const { error } = await supabase.from('sales').insert(localSales);
      setSyncLogs(p => [...p, error ? { text: `Sales Push Failed: ${error.message}`, type: 'error' } : { text: `✅ Pushed ${localSales.length} Sales!`, type: 'success' }]);
    }
    if (localExpenses.length > 0) {
      const { error } = await supabase.from('expenses').insert(localExpenses);
      setSyncLogs(p => [...p, error ? { text: `Expenses Push Failed: ${error.message}`, type: 'error' } : { text: `✅ Pushed ${localExpenses.length} Expenses!`, type: 'success' }]);
    }
    setSyncLogs(p => [...p, { text: 'Migration complete. Refresh to sync.', type: 'info' }]);
  };

  /* ── Bill CRUD ──────────────────────────────────────────────────────── */
  const handleAddBill = () => {
    if (!newBill.name.trim() || !newBill.amount) return alert('பில் பெயர் மற்றும் தொகை அவசியம்.');
    const bill = {
      id: `bill_${Date.now()}`,
      name: newBill.name.trim(),
      amount: parseFloat(newBill.amount),
      dueDay: Math.min(31, Math.max(1, parseInt(newBill.dueDay) || 1)),
      category: newBill.category
    };
    setBills([...(bills || []), bill]);
    setNewBill({ name: '', amount: '', dueDay: 1, category: 'House Rent' });
    setShowAddBill(false);
  };

  const handleDeleteBill = (id) => {
    if (!window.confirm('இந்த பில்லை நீக்கவா?')) return;
    setBills((bills || []).filter(b => b.id !== id));
  };

  const handleUpdateBillField = (id, field, value) => {
    setBills((bills || []).map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const budgets = categoryBudgets ?? {};

  return (
    <div className="space-y-6 animate-in fade-in pt-4">

      {/* ── PRINTABLE REPORT ─────────────────────────────────────────── */}
      <div id="printable-report" className="hidden print:block w-full bg-white text-black font-sans pb-10">
        <div className="flex justify-between items-end border-b-4 border-gray-800 pb-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-widest">{language === 'ta' ? 'கடை நிதி அறிக்கை' : 'Financial Statement'}</h1>
            <h2 className="text-xl font-bold text-gray-600 mt-1">Veedu & Kadai Cloud System</h2>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-800">Generated On:</p>
            <p className="text-gray-600 font-mono">{new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
        <table className="w-full mb-8 border-collapse border border-gray-300 shadow-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-800 border-b-2 border-gray-400">
              <th className="border p-3 text-left">Date</th>
              <th className="border p-3 text-left">Category</th>
              <th className="border p-3 text-right">Amount</th>
              <th className="border p-3 text-center">Type</th>
            </tr>
          </thead>
          <tbody>
            {safeTransactions.map(tx => (
              <tr key={tx.id} className="border-b hover:bg-gray-50">
                <td className="border border-gray-200 p-3">{tx?.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                <td className="border border-gray-200 p-3 font-semibold">{tc(tx?.category || 'Unknown')}</td>
                <td className="border border-gray-200 p-3 text-right font-mono">₹ {Math.abs(tx?.amount || 0).toFixed(2)}</td>
                <td className={`border border-gray-200 p-3 text-center font-bold ${tx?.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                  {tx?.type === 'income' ? 'INCOME' : 'EXPENSE'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-8">
          <div className="w-80 bg-gray-50 rounded-xl p-5 border-2 border-gray-400">
            <div className="flex justify-between mb-3 text-sm"><span>Total Income:</span><span className="text-emerald-700 font-bold">₹ {totalIncome.toFixed(2)}</span></div>
            <div className="flex justify-between mb-3 text-sm"><span>Total Expense:</span><span className="text-red-600 font-bold">₹ {totalExpense.toFixed(2)}</span></div>
            <div className="flex justify-between mt-4 pt-4 border-t-2 border-gray-300 font-black text-lg">
              <span>Net:</span>
              <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}>₹ {netProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="glass-card p-6 flex items-center justify-between">
        <div className="flex flex-row items-center gap-3">
          {avatarUrl && !imgError ? (
            <img src={avatarUrl} alt="Profile" onError={() => setImgError(true)} className="w-10 h-10 rounded-full border-2 border-white/10 shadow-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg border-2 border-white/10 shadow-lg flex-shrink-0">
              {initial}
            </div>
          )}
          <h1 className="text-lg font-bold text-white">Hello, {fullName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-neonEmerald">
            <Settings className="w-5 h-5" />
            <span className="font-bold">{t('settings')}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-neonRose/20 text-neonRose px-4 py-2 rounded-xl text-sm font-bold hover:bg-neonRose hover:text-white transition-all">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{language === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
          </button>
        </div>
      </header>

      <div className="settings-content grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Language ─────────────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Globe className="w-5 h-5 text-gray-400" /> {t('language')}</h3>
          <div className="flex bg-darkBg/50 rounded-xl p-1 border border-white/10">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${language === 'en' ? 'bg-neonEmerald/20 text-neonEmerald' : 'text-gray-400 hover:text-white'}`}>English</button>
            <button onClick={() => setLanguage('ta')} className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${language === 'ta' ? 'bg-neonEmerald/20 text-neonEmerald' : 'text-gray-400 hover:text-white'}`}>தமிழ்</button>
          </div>
        </div>

        {/* ── Cloud Debugger ─────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Database className="w-5 h-5 text-neonEmerald" /> Cloud Debugger</h3>
          <div className="flex gap-3 mb-4">
            <button onClick={handleTestConnection} className="flex-1 bg-darkBg border border-neonEmerald/30 text-neonEmerald py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold hover:bg-neonEmerald/10 transition-all">
              <CheckCircle2 className="w-4 h-4" /> Test
            </button>
            <button onClick={handleForceMigration} className="flex-1 bg-neonEmerald/20 border border-neonEmerald/50 text-neonEmerald py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold hover:bg-neonEmerald hover:text-white transition-all">
              <RefreshCw className="w-4 h-4" /> Push Data
            </button>
          </div>
          {syncLogs.length > 0 && (
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-xs max-h-36 overflow-y-auto space-y-1.5">
              {syncLogs.map((log, i) => (
                <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'}`}>
                  <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recurring Bills ────────────────────────────────────────── */}
        <div className="glass-card p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              {language === 'ta' ? 'தொடர் பில்கள் மற்றும் நிலுவைத் தேதிகள்' : 'Recurring Bills & Due Dates'}
            </h3>
            <button
              onClick={() => setShowAddBill(true)}
              className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-amber-500 hover:text-white transition-all"
            >
              <Plus className="w-4 h-4" />
              {language === 'ta' ? 'பில் சேர்க்க' : 'Add Bill'}
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-5">
            {language === 'ta'
              ? 'தொகை மற்றும் நிலுவைத் தேதி அமைத்தால், முகப்பில் தானாக நினைவூட்டல் வரும்.'
              : 'Set amount and due day — Dashboard alerts fire automatically each month.'}
          </p>

          {/* Add Bill Form */}
          {showAddBill && (
            <div className="mb-4 bg-darkBg/60 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                {language === 'ta' ? 'புதிய தொடர் பில்' : 'New Recurring Bill'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{language === 'ta' ? 'பில் பெயர்' : 'Bill Name'}</label>
                  <input type="text" value={newBill.name} onChange={e => setNewBill(b => ({ ...b, name: e.target.value }))}
                    className="glass-input w-full py-2 text-sm" placeholder={language === 'ta' ? 'எ.கா. EB, தண்ணீர்' : 'e.g. EB Bill'} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{language === 'ta' ? 'வகை' : 'Category'}</label>
                  <select value={newBill.category} onChange={e => setNewBill(b => ({ ...b, category: e.target.value }))}
                    className="glass-input w-full py-2 text-sm [&>option]:bg-darkCard">
                    {BILL_CATEGORIES.map(c => <option key={c} value={c}>{tc(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{language === 'ta' ? 'தொகை (₹)' : 'Amount (₹)'}</label>
                  <AmountInput value={newBill.amount} onChange={e => setNewBill(b => ({ ...b, amount: e.target.value }))}
                    className="glass-input w-full py-2 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{language === 'ta' ? 'தேதி (1–31)' : 'Due Day (1–31)'}</label>
                  <input type="number" min="1" max="31" value={newBill.dueDay}
                    onChange={e => setNewBill(b => ({ ...b, dueDay: e.target.value }))}
                    className="glass-input w-full py-2 text-sm text-center" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleAddBill} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500 hover:text-white transition-all text-sm font-semibold">
                  <Check className="w-4 h-4" /> {language === 'ta' ? 'சேமி' : 'Save Bill'}
                </button>
                <button onClick={() => setShowAddBill(false)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition-all text-sm font-semibold">
                  <X className="w-4 h-4" /> {language === 'ta' ? 'ரத்து' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Bill List */}
          {(bills || []).length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">
              {language === 'ta' ? '"பில் சேர்க்க" கொண்டு தொடங்கவும்.' : 'No bills yet. Click "Add Bill" to start.'}
            </div>
          ) : (
            <div className="space-y-2">
              {(bills || []).map(bill => (
                <div key={bill.id} className="flex items-center gap-3 bg-darkBg/40 border border-white/10 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{bill.name}</div>
                    <div className="text-xs text-gray-400">{tc(bill.category)} • {language === 'ta' ? `${bill.dueDay}ம் தேதி` : `Due day ${bill.dueDay}`}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">₹</span>
                      <AmountInput value={bill.amount || ''} onChange={e => handleUpdateBillField(bill.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="bg-darkCard border border-white/20 rounded-lg py-1.5 pl-5 pr-2 text-sm outline-none w-24" placeholder="0" />
                    </div>
                    <input type="number" min="1" max="31" value={bill.dueDay}
                      onChange={e => handleUpdateBillField(bill.id, 'dueDay', Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="bg-darkCard border border-white/20 rounded-lg py-1.5 px-2 text-sm outline-none w-14 text-center" />
                    <button onClick={() => handleDeleteBill(bill.id)} className="p-1.5 text-gray-500 hover:text-neonRose hover:bg-neonRose/10 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Category Budgets (Collapsible) ─────────────────────────── */}
        <div className="glass-card p-6 md:col-span-2 mb-20">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-400" /> {t('categoryBudgets')}
            </h3>
            <button
              onClick={() => setShowBudgets(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${showBudgets ? 'bg-neonEmerald/20 text-neonEmerald border-neonEmerald/40' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
            >
              {showBudgets
                ? <><ChevronUp className="w-4 h-4" /> {language === 'ta' ? 'மூடு' : 'Hide'}</>
                : <><Plus className="w-4 h-4" /> {language === 'ta' ? 'பட்ஜெட் சேர்க்க' : 'Add Budget'}</>
              }
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2 mb-4">
            {language === 'ta'
              ? 'வகைவாரி செலவு வரம்பு அமைக்க. வரம்பு தாண்டினால் முகப்பில் அலர்ட் வரும்.'
              : 'Set per-category spending limits. Red alerts fire on Dashboard when exceeded.'}
          </p>
          {showBudgets && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-4 animate-in fade-in duration-200">
              {CATEGORIES.KADAI.map(cat => (
                <div key={cat} className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">{tc(cat)}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                    <AmountInput
                      value={budgets[cat] ?? 0}
                      onChange={e => setCategoryBudget(cat, parseFloat(e.target.value) || 0)}
                      className="glass-input pl-8 py-3 w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
