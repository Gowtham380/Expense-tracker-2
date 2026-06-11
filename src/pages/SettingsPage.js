import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { LogOut, KeyRound, Lock, Unlock, Plus, X, Store, Tags, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import AmountInput from '../components/AmountInput';
import { showToast } from '../utils/toast';


export default function SettingsPage() {
  const { 
    customCategories, addCustomCategory, deleteCustomCategory, 
    securePin, setSecurePin,
    savingsTarget, setSavingsTarget,
    language, switchLanguage,
    recurringReminders, addRecurringReminder, deleteRecurringReminder,
    themeMode, setThemeMode,
    t, tc, session 
  } = useExpense();

  const [newCustomCat, setNewCustomCat] = useState('');
  const [imgError, setImgError]         = useState(false);

  // ── PIN Gateway State ──────────────────────────────────────────
  const [pwStep, setPwStep] = useState(0); // 0: hidden, 1: verify, 2: new pin
  const [verifyPin, setVerifyPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pwStatus, setPwStatus] = useState({ error: '', loading: false });

  const [activeCatTab, setActiveCatTab] = useState('expense'); // 'income' or 'expense'
  
  const [remType, setRemType] = useState('expense');
  const [remCat, setRemCat] = useState('');
  const [remAmount, setRemAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly'); // 'daily' | 'weekly' | 'monthly'
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(1); // 1 (Mon) to 7 (Sun)
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(1); // 1 to 31
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 100% Impact Absolute Identity Pipeline
  const currentUserObj = session?.user;
  const directGoogleMetadata = currentUserObj?.user_metadata;
  
  // Directly pull the high-resolution avatar URI from the native authenticated session dictionary
  let resolvedProfilePicUrl = directGoogleMetadata?.avatar_url || directGoogleMetadata?.picture || null;
  
  // Strict Fallback Tier: Gravatar Global Asset Resolution Framework if network profiles are blocked
  if (!resolvedProfilePicUrl && currentUserObj?.email) {
    const emailHashSanitized = currentUserObj.email.trim().toLowerCase();
    resolvedProfilePicUrl = `https://www.gravatar.com/avatar/${emailHashSanitized}?d=identicon&s=150`;
  }

  const calculatedProfileName = directGoogleMetadata?.full_name || directGoogleMetadata?.name || currentUserObj?.email?.split('@')[0] || "Gowtham Gowtham";
  const layoutLetterInitial = calculatedProfileName.charAt(0).toUpperCase();

  const handleLogout = async () => await supabase.auth.signOut();

  const handleAddCustomCategory = () => {
    if (!newCustomCat.trim()) return;
    addCustomCategory({ name: newCustomCat.trim(), type: activeCatTab });
    setNewCustomCat('');
  };

  const handleAddReminder = async () => {
    if (isSubmitting) return;
    if (!remCat || !remAmount) return;
    if (frequency === 'weekly' && !selectedDayOfWeek) return;
    if (frequency === 'monthly' && !selectedDayOfMonth) return;
    
    // Explicitly parse string values, safely discarding leading zeros safely
    const numericAmount = parseFloat(remAmount);

    // Event Gated Isolation Checklist
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast(language === 'ta' ? "அமௌன்ட் ₹0-விட அதிகமாக இருக்க வேண்டும்!" : "Amount must be greater than ₹0.", "error");
      return; 
    }
    
    if (recurringReminders?.some(r => r.category === remCat && r.type === remType)) {
      showToast(language === 'ta' ? 'இந்த வகைக்கு ஏற்கனவே நினைவூட்டல் உள்ளது!' : 'Reminder for this category already exists!', "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addRecurringReminder({
        id: "rem_" + Date.now().toString(),
        type: remType,
        category: remCat,
        amount: numericAmount,
        frequency,
        targetDay: frequency === 'end_of_month' ? null : undefined,
        day: frequency === 'end_of_month' ? null : (frequency === 'weekly' ? selectedDayOfWeek : (frequency === 'monthly' ? selectedDayOfMonth : null))
      });
      showToast(language === 'ta' ? 'நினைவூட்டல் வெற்றிகரமாக சேர்க்கப்பட்டது!' : 'Reminder added successfully!', 'success');
      setRemCat('');
      setRemAmount('');
    } catch (error) {
      showToast(language === 'ta' ? 'பிழை ஏற்பட்டது!' : 'An error occurred!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCurrent = () => {
    setPwStatus({ error: '', loading: true });
    if (verifyPin !== securePin) {
      setPwStatus({ error: 'Incorrect PIN', loading: false });
    } else {
      setPwStep(2);
      setPwStatus({ error: '', loading: false });
    }
  };

  const handleUpdatePassword = () => {
    if (newPin !== confirmPin) return setPwStatus({ error: 'PINs do not match', loading: false });
    if (newPin.length < 4 || !/^\d*$/.test(newPin)) return setPwStatus({ error: 'Must be 4 digits', loading: false });
    
    setPwStatus({ error: '', loading: true });
    setSecurePin(newPin);
    setPwStep(0);
    setVerifyPin(''); setNewPin(''); setConfirmPin('');
    setPwStatus({ error: '', loading: false });
  };

  const activeCategoriesList = customCategories?.filter(c => c.type === activeCatTab).map(c => c.name) || [];

  return (
    <div className="bg-slate-50 dark:bg-[#050709] min-h-screen text-slate-900 dark:text-slate-200 transition-colors duration-300 animate-in fade-in pb-24">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-transparent rounded-2xl border border-slate-200/50 dark:border-none shadow-[0_4px_24px_rgba(15,23,42,0.015)] dark:shadow-none">
          <div className="flex items-center gap-4">
            {resolvedProfilePicUrl && !imgError ? (
              <img src={resolvedProfilePicUrl} alt="Profile" onError={() => setImgError(true)} className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 object-cover flex-shrink-0 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-lg border border-white/10 flex-shrink-0 shadow-sm">
                {layoutLetterInitial}
              </div>
            )}
            <h1 className="text-slate-900 dark:text-white font-bold text-base">{calculatedProfileName}</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-[#38240D]/[0.06] hover:bg-[#38240D]/[0.1] text-[#38240D] dark:bg-white/[0.05] dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t('sign_out')}</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">

        {/* ── CAPSULE 1: PROFILE & ACCOUNT SECURITY ──────────────────────── */}
        <h2 className={`text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2 mt-6 block px-1 flex items-center gap-1.5`}>
          <ShieldCheck className="w-3.5 h-3.5" /> {t('profile_security')}
        </h2>
        <div className="bg-white dark:bg-slate-900/40 border border-[#38240D]/[0.08] dark:border-white/[0.05] rounded-2xl p-2 space-y-0.5 shadow-sm">
          <div className="p-3 space-y-1">
            {/* PIN Row */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-transparent border-b border-slate-100/80 dark:border-white/[0.05] last:border-none">
              <div className="flex items-center gap-3 text-slate-900 dark:text-slate-200">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400"><KeyRound className="w-4 h-4" /></div>
                <span className={`text-sm font-medium ${language === 'ta' ? 'leading-relaxed' : ''}`}>{t('update_security_pin')}</span>
              </div>
              <button onClick={() => { setPwStep(pwStep === 0 ? 1 : 0); setVerifyPin(''); }} className="bg-[#38240D]/[0.06] hover:bg-[#38240D]/[0.1] text-[#38240D] dark:bg-white/[0.05] dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                {pwStep === 0 ? t('modify') : t('cancel')}
              </button>
            </div>

            {/* Accordion Dropdown for PIN */}
            {pwStep === 1 && (
              <div className="mt-2 p-4 bg-white/[0.03] border border-white/[0.05] rounded-xl space-y-3 animate-in slide-in-from-top-2 fade-in">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs mb-2"><Lock className="w-3.5 h-3.5 text-slate-400" /> {t('verify_identity')}</div>
                <input type="password" maxLength={4} value={verifyPin} onChange={e => {if(/^\d*$/.test(e.target.value)) setVerifyPin(e.target.value);}} placeholder={t('current_password')} onKeyDown={e => e.key === 'Enter' && handleVerifyCurrent()} className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition-colors tracking-widest text-center" />
                {pwStatus.error && <p className="text-[10px] text-rose-400 font-medium">{pwStatus.error}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleVerifyCurrent} disabled={pwStatus.loading} className="flex-1 bg-slate-100 hover:bg-white text-slate-900 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50">{t('verify_identity')}</button>
                </div>
              </div>
            )}

            {pwStep === 2 && (
              <div className="mt-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3 animate-in slide-in-from-top-2 fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2"><Unlock className="w-3.5 h-3.5" /> {t('set_new_credentials')}</div>
                <input type="password" maxLength={4} value={newPin} onChange={e => {if(/^\d*$/.test(e.target.value)) setNewPin(e.target.value);}} placeholder={t('new_pin')} className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition-colors tracking-widest text-center" />
                <input type="password" maxLength={4} value={confirmPin} onChange={e => {if(/^\d*$/.test(e.target.value)) setConfirmPin(e.target.value);}} onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} placeholder={t('confirm_pin')} className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition-colors tracking-widest text-center" />
                {pwStatus.error && <p className="text-[10px] text-rose-400 font-medium">{pwStatus.error}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleUpdatePassword} disabled={pwStatus.loading} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50">{t('save_pin')}</button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── CAPSULE 2: CORE BUSINESS PARAMETERS ─────────────────────── */}
        <h2 className={`text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2 mt-6 block px-1 flex items-center gap-1.5`}>
          <Store className="w-3.5 h-3.5" /> {t('core_parameters')}
        </h2>
        <div className="bg-white dark:bg-[#1e293b]/30 border border-slate-200/80 dark:border-white/[0.05] rounded-2xl p-2 space-y-0.5 shadow-sm">
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language Switcher Row */}
              <div className="space-y-2 md:col-span-2">
                <label className={`text-xs text-slate-500 pl-1 block ${language === 'ta' ? 'tracking-normal leading-relaxed' : ''}`}>{t('app_language')}</label>
                <div className="bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-white/[0.04] flex items-center w-full max-w-[240px]">
                  <button onClick={() => switchLanguage('en')} className={`${language === 'en' ? 'bg-white dark:bg-slate-800 text-[#0f172a] dark:text-white font-bold text-xs shadow-[0_2px_8px_rgba(15,23,42,0.08)] py-1.5 px-4 rounded-lg flex-1 text-center transition-all' : 'text-[#0f172a]/60 dark:text-slate-400 font-bold text-xs flex-1 text-center hover:text-[#0f172a] dark:hover:text-white transition-colors'}`}>English</button>
                  <button onClick={() => switchLanguage('ta')} className={`${language === 'ta' ? 'bg-white dark:bg-slate-800 text-[#0f172a] dark:text-white font-bold text-xs shadow-[0_2px_8px_rgba(15,23,42,0.08)] py-1.5 px-4 rounded-lg flex-1 text-center transition-all' : 'text-[#0f172a]/60 dark:text-slate-400 font-bold text-xs flex-1 text-center hover:text-[#0f172a] dark:hover:text-white transition-colors'}`}>தமிழ்</button>
                </div>
              </div>

              {/* Theme Switcher Row */}
              <div className="space-y-2 md:col-span-2">
                <label className={`text-xs text-slate-500 pl-1 block ${language === 'ta' ? 'tracking-normal leading-relaxed' : ''}`}>
                  {language === 'ta' ? 'பயன்பாட்டு தீம்' : 'Application Theme'}
                </label>
                <div className="bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-white/[0.04] flex items-center w-full max-w-[240px]">
                  <button onClick={() => setThemeMode('light')} className={`${themeMode === 'light' ? 'bg-white dark:bg-slate-800 text-[#0f172a] dark:text-white font-bold text-xs shadow-[0_2px_8px_rgba(15,23,42,0.08)] py-1.5 px-4 rounded-lg flex-1 text-center transition-all' : 'text-[#0f172a]/60 dark:text-slate-400 font-bold text-xs flex-1 text-center hover:text-[#0f172a] dark:hover:text-white transition-colors'}`}>
                    {language === 'ta' ? 'ஒளி' : 'Light'}
                  </button>
                  <button onClick={() => setThemeMode('dark')} className={`${themeMode === 'dark' ? 'bg-white dark:bg-slate-800 text-[#0f172a] dark:text-white font-bold text-xs shadow-[0_2px_8px_rgba(15,23,42,0.08)] py-1.5 px-4 rounded-lg flex-1 text-center transition-all' : 'text-[#0f172a]/60 dark:text-slate-400 font-bold text-xs flex-1 text-center hover:text-[#0f172a] dark:hover:text-white transition-colors'}`}>
                    {language === 'ta' ? 'இருள்' : 'Dark'}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className={`text-xs text-slate-500 pl-1 ${language === 'ta' ? 'tracking-normal leading-relaxed' : ''}`}>{t('monthly_savings_target')}</label>
                <AmountInput 
                  value={savingsTarget || ''} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "" || val === undefined) return; // Immediate escape boundary for form reset
                    setSavingsTarget(parseFloat(val) || 0);
                  }}
                  className="w-full bg-slate-50/60 dark:bg-slate-900/50 text-[#0f172a] dark:text-white border border-slate-300/80 dark:border-white/[0.08] focus:border-slate-500 focus:ring-0 rounded-xl px-4 py-2.5 text-sm font-bold shadow-inner transition-shadow"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── CAPSULE 3: CATEGORY ARCHITECTURE ENGINE ─────────────────── */}
        <h2 className={`text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2 mt-6 block px-1 flex items-center gap-1.5`}>
          <Tags className="w-3.5 h-3.5" /> {t('category_architecture')}
        </h2>
        <div className="bg-white dark:bg-[#1e293b]/30 border border-slate-200/80 dark:border-white/[0.05] rounded-2xl p-2 space-y-0.5 shadow-sm">
          <div className="p-3">
            <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-white/[0.04] mb-4">
              <button onClick={() => setActiveCatTab('income')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCatTab === 'income' ? 'bg-white dark:bg-slate-800 text-[#0f172a] dark:text-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]' : 'text-[#0f172a]/60 dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white'}`}>
                {t('income_categories')}
              </button>
              <button onClick={() => setActiveCatTab('expense')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCatTab === 'expense' ? 'bg-white dark:bg-slate-800 text-[#0f172a] dark:text-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]' : 'text-[#0f172a]/60 dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white'}`}>
                {t('expense_categories')}
              </button>
            </div>

            <div className={`flex items-center gap-2 w-full bg-slate-50/60 dark:bg-slate-900/50 border border-slate-300/80 dark:border-white/[0.08] focus-within:border-slate-500 rounded-xl p-1 mb-4 transition-colors shadow-inner`}>
              <input
                type="text"
                value={newCustomCat}
                onChange={(e) => setNewCustomCat(e.target.value)}
                placeholder={t('add_custom_category')}
                className="flex-1 bg-transparent px-3 py-1.5 text-sm text-[#0f172a] dark:text-white font-bold outline-none placeholder:text-[#0f172a]/40 dark:placeholder:text-slate-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}
              />
              <button
                onClick={handleAddCustomCategory}
                className="bg-[#38240D] dark:bg-slate-100 hover:scale-[0.98] transition-transform text-white dark:text-slate-900 font-bold px-4 py-2 rounded-xl shadow-sm text-xs flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeCategoriesList.map(cat => (
                <div key={cat} className={`group bg-slate-100/80 text-[#0f172a] dark:bg-white/[0.03] dark:text-slate-300 border border-slate-200 dark:border-white/[0.04] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm ${language === 'ta' ? 'tracking-normal leading-relaxed' : ''}`}>
                  {tc(cat)}
                  <button
                    onClick={() => {
                      if(window.confirm(`Delete category "${cat}"?`)) deleteCustomCategory(cat);
                    }}
                    className="opacity-60 hover:opacity-100 hover:text-rose-500 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CAPSULE 4: AUTOMATED REMINDERS ─────────────────────────────── */}
        {/* Dynamic Language Gate Check */}
        <h3 className="text-[#0f172a] dark:text-slate-200 text-xs font-black tracking-widest uppercase mb-4 mt-6 block px-1 flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5" /> {language === 'ta' ? 'தானியங்கி நினைவூட்டல்கள்' : 'Automated Reminders'}
        </h3>
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl shadow-[0_4px_24px_rgba(15,23,42,0.015)] dark:shadow-none">
          <div className="p-5">
            <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-white/[0.04] mb-4">
              <button onClick={() => setRemType('income')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${remType === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-[0_2px_8px_rgba(15,23,42,0.08)]' : 'text-[#0f172a]/60 dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white'}`}>
                Income
              </button>
              <button onClick={() => setRemType('expense')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${remType === 'expense' ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-[0_2px_8px_rgba(15,23,42,0.08)]' : 'text-[#0f172a]/60 dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white'}`}>
                Expense
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <select value={remCat} onChange={e => setRemCat(e.target.value)} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#0f172a] dark:text-slate-200 outline-none col-span-2 focus:border-slate-500 font-medium [&>option]:bg-white dark:[&>option]:bg-slate-900">
                <option value="">Select Category...</option>
                {customCategories?.filter(c => c.type === remType).map(c => <option key={c.name} value={c.name}>{tc(c.name)}</option>)}
              </select>
              <AmountInput
                value={remAmount}
                onChange={e => setRemAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#0f172a] dark:text-slate-200 outline-none w-full focus:border-slate-500 font-medium"
              />
              <select value={frequency} onChange={e => setFrequency(e.target.value)} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#0f172a] dark:text-slate-200 outline-none w-full focus:border-slate-500 font-medium [&>option]:bg-white dark:[&>option]:bg-slate-900">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="end_of_month">{language === 'ta' ? 'மாத இறுதி' : 'End of Month'}</option>
              </select>
              
              {frequency === 'weekly' && (
                <select value={selectedDayOfWeek} onChange={e => setSelectedDayOfWeek(Number(e.target.value))} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#0f172a] dark:text-slate-200 outline-none col-span-2 focus:border-slate-500 font-medium [&>option]:bg-white dark:[&>option]:bg-slate-900">
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={7}>Sunday</option>
                </select>
              )}
              {frequency === 'monthly' && (
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={selectedDayOfMonth}
                  onChange={e => setSelectedDayOfMonth(Number(e.target.value))}
                  placeholder="Day (1-31)"
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#0f172a] dark:text-slate-200 outline-none col-span-2 focus:border-slate-500 font-medium"
                />
              )}
            </div>
            
            <button 
              onClick={handleAddReminder} 
              disabled={isSubmitting || !remCat || !remAmount || (frequency === 'weekly' && !selectedDayOfWeek) || (frequency === 'monthly' && !selectedDayOfMonth)} 
              className={`w-full font-black text-sm py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] mt-5 cursor-pointer border-none select-none disabled:opacity-40 disabled:cursor-not-allowed
                ${isSubmitting 
                  ? 'bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-600' 
                  : 'bg-[#0f172a] text-white hover:bg-[#0f172a]/90 dark:bg-white dark:text-[#090d16] dark:hover:bg-white/95 shadow-[0_4px_20px_rgba(15,23,42,0.1)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.08)]'
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent dark:border-slate-400 rounded-full animate-spin"></div>
                  <span>Saving…</span>
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> 
                  <span>{language === 'ta' ? 'நினைவூட்டலைச் சேர்' : 'Add Reminder'}</span>
                </>
              )}
            </button>

            <div className="mt-6 space-y-2">
              {(recurringReminders || []).map(rem => (
                <div key={rem.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/[0.05] p-3 rounded-xl shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rem.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-sm font-bold text-[#0f172a] dark:text-slate-200">{tc(rem.category)}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">
                      {rem.frequency === 'daily' ? 'Every day' : 
                       rem.frequency === 'weekly' ? `Every week on ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][rem.day - 1]}` :
                       rem.frequency === 'end_of_month' ? (language === 'ta' ? 'மாத இறுதி' : 'End of Month') :
                       rem.frequency === 'monthly' ? `Every month on day ${rem.day}` :
                       `Every month on day ${rem.day}`} • ₹{rem.amount}
                    </div>
                  </div>
                  <button onClick={() => { if(window.confirm('Delete reminder?')) deleteRecurringReminder(rem.id); }} className="text-slate-400 hover:text-rose-500 transition-colors p-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── GLOBAL STATUS ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 mt-8 pb-8 text-[10px] text-slate-600 font-medium uppercase tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
        {t('cloud_architecture')}
      </div>
    </div>
  );
}
