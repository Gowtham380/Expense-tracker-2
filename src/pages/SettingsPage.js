import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { LogOut, KeyRound, Lock, Unlock, Plus, X, Store, Tags, ShieldCheck, Star, Sparkles } from 'lucide-react';
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
    t, tc, session,
    deferredPrompt, setDeferredPrompt
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
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(''); // 1 to 31 (empty initially for placeholder)
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

  const handleLogout = async () => await supabase.auth.signOut();

  // 1. Create a defensive fetcher
  const fetchUserSettings = async (userId) => {
    if (!userId) return; // Prevent 400 error
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // ALWAYS use maybeSingle() to handle missing rows without 400 errors

    if (error) console.error("Database fetch failed:", error);
    else if (data) {
      // Update local state if necessary
    }
  };

  // 2. Protect the useEffect
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserSettings(session.user.id);
    }
  }, [session?.user?.id]);

  const handleAddCustomCategory = () => {
    if (!newCustomCat.trim()) return;
    addCustomCategory({ name: newCustomCat.trim(), type: activeCatTab });
    setNewCustomCat('');
  };

  const handleAddReminder = () => {
    if (isSubmitting) return;

    // ── Guard: all fields required ──────────────────────────────────────────
    if (!remCat) {
      showToast(language === 'ta' ? 'வகையை தேர்ந்தெடுக்கவும்!' : 'Please select a category.', 'error');
      return;
    }
    if (frequency === 'weekly' && !selectedDayOfWeek) return;
    if (frequency === 'monthly' && !selectedDayOfMonth) return;

    // ── Amount validation: read directly from state (always current in event handlers) ─
    const numericAmount = parseFloat(String(remAmount).trim());
    if (!remAmount || isNaN(numericAmount) || numericAmount <= 0) {
      showToast(language === 'ta' ? 'தொகை ₹0-ஐ விட அதிகமாக இருக்க வேண்டும்!' : 'Amount must be greater than ₹0.', 'error');
      return;
    }

    // ── Duplicate guard ─────────────────────────────────────────────────────
    if (recurringReminders?.some(r => r.category === remCat && r.type === remType)) {
      showToast(language === 'ta' ? 'இந்த வகைக்கு ஏற்கனவே நினைவூட்டல் உள்ளது!' : 'A reminder for this category already exists!', 'error');
      return;
    }

    // ── Save ────────────────────────────────────────────────────────────────
    setIsSubmitting(true);
    const safeAmount = Math.round(numericAmount * 100) / 100;
    addRecurringReminder({
      id: 'rem_' + Date.now().toString(),
      type: remType,
      category: remCat,
      amount: safeAmount,
      frequency,
      day: frequency === 'end_of_month'
        ? null
        : frequency === 'weekly'
          ? selectedDayOfWeek
          : frequency === 'monthly'
            ? selectedDayOfMonth
            : null,
    });

    showToast(language === 'ta' ? 'நினைவூட்டல் வெற்றிகரமாக சேர்க்கப்பட்டது!' : 'Reminder added successfully!', 'success');
    setRemCat('');
    setRemAmount('');
    setSelectedDayOfMonth('');
    setTimeout(() => setIsSubmitting(false), 300);
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

  const handleResetPassword = async () => {
    if (!currentUserObj?.email) return alert("Email not found in session.");
    setPwStatus({ error: '', loading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(currentUserObj.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setPwStatus({ error: '', loading: false });
    if (error) alert(error.message);
    else alert("Check your email for the reset link!");
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

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // Guard against early render
  if (!session?.user) {
    return <div className="flex justify-center p-10 text-slate-500">Authenticating...</div>;
  }

  return (
    <div className="bg-slate-50 dark:bg-black min-h-screen text-slate-900 dark:text-white transition-colors duration-300 animate-in fade-in pb-24">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-black dark:border-black shadow-sm dark:shadow-none !shadow-none">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {resolvedProfilePicUrl && !imgError ? (
                <img 
                  src={resolvedProfilePicUrl} 
                  alt="Profile" 
                  onError={() => setImgError(true)}
                  className="w-14 h-14 shrink-0 rounded-full border-2 border-slate-700 object-cover aspect-square shadow-lg" 
                />
              ) : (
                <div className="w-14 h-14 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold border-2 border-slate-200 dark:border-black dark:border-black text-slate-900 dark:text-white shadow-sm dark:shadow-none !shadow-none aspect-square">
                  {currentUserObj?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <h1 className="text-slate-900 dark:text-white font-bold text-base">{calculatedProfileName}</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-slate-200 dark:border-black dark:border-black">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t('sign_out')}</span>
          </button>
        </div>
      </header>

      {/* Mobile PWA Install Nudge Banner */}
      {isMobile && !isStandalone && (
        <div className="max-w-2xl mx-auto px-4 mb-6">
          <div className="relative overflow-hidden glass-premium rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/5 shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {language === 'ta' ? 'Expenza Pro-ஐ மொபைல் ஆப்பாக மாற்றுக!' : 'Install Expenza Pro Mobile App!'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {language === 'ta' 
                    ? 'வேகமான அணுகல், ஆஃப்லைன் மோட் மற்றும் முழுத்திரை அனுபவத்திற்கு உடனே உங்கள் முகப்புத் திரையில் சேர்க்கவும்.' 
                    : 'Get home screen quick access, automated reminders, and complete offline usability.'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`PWA settings install outcome: ${outcome}`);
                    setDeferredPrompt(null);
                  } else {
                    showToast(
                      language === 'ta'
                        ? 'உலாவியின் பகிர்ந்து (Share) பொத்தானை அழுத்தி "முகப்புத் திரையில் சேர்" (Add to Home Screen) என்பதைத் தேர்ந்தெடுக்கவும்.'
                        : 'Tap your browser\'s share menu and select "Add to Home Screen" to install.',
                      'info'
                    );
                  }
                }}
                className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'ta' ? 'இப்போது நிறுவு' : 'INSTALL NOW'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">

        {/* ── CAPSULE 1: PROFILE & ACCOUNT SECURITY ──────────────────────── */}
        <h2 className={`text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-2 mt-6 block px-1 flex items-center gap-1.5`}>
          <ShieldCheck className="w-3.5 h-3.5" /> {t('profile_security')}
        </h2>
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black rounded-2xl p-2 space-y-0.5 shadow-sm dark:shadow-none !shadow-none">
          <div className="p-3 space-y-1">
            {/* PIN Row */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-black/50 last:border-none">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"><KeyRound className="w-4 h-4" /></div>
                <span className={`text-sm font-medium ${language === 'ta' ? 'leading-relaxed' : ''}`}>{t('update_security_pin')}</span>
              </div>
              <button onClick={() => { setPwStep(pwStep === 0 ? 1 : 0); setVerifyPin(''); }} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-black dark:border-black text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                {pwStep === 0 ? t('modify') : t('cancel')}
              </button>
            </div>

            {/* Accordion Dropdown for PIN */}
            {pwStep === 1 && (
              <div className="mt-2 p-4 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black rounded-xl space-y-3 animate-in slide-in-from-top-2 fade-in">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs mb-2"><Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {t('verify_identity')}</div>
                <input type="password" maxLength={4} value={verifyPin} onChange={e => {if(/^\d*$/.test(e.target.value)) setVerifyPin(e.target.value);}} placeholder={t('current_password')} onKeyDown={e => e.key === 'Enter' && handleVerifyCurrent()} className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none transition-colors tracking-widest text-center shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                {pwStatus.error && <p className="text-[10px] text-rose-500 dark:text-rose-400 font-medium">{pwStatus.error}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleVerifyCurrent} disabled={pwStatus.loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50">{t('verify_identity')}</button>
                  <button onClick={handleResetPassword} disabled={pwStatus.loading} className="bg-transparent border border-slate-300 dark:border-black dark:border-black hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 py-2 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm">{language === 'ta' ? 'பின்னை மறந்துவிட்டீர்களா?' : 'Forgot PIN?'}</button>
                </div>
              </div>
            )}

            {pwStep === 2 && (
              <div className="mt-2 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl space-y-3 animate-in slide-in-from-top-2 fade-in">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-2"><Unlock className="w-3.5 h-3.5" /> {t('set_new_credentials')}</div>
                <input type="password" maxLength={4} value={newPin} onChange={e => {if(/^\d*$/.test(e.target.value)) setNewPin(e.target.value);}} placeholder={t('new_pin')} className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none transition-colors tracking-widest text-center shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                <input type="password" maxLength={4} value={confirmPin} onChange={e => {if(/^\d*$/.test(e.target.value)) setConfirmPin(e.target.value);}} onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} placeholder={t('confirm_pin')} className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none transition-colors tracking-widest text-center shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                {pwStatus.error && <p className="text-[10px] text-rose-500 dark:text-rose-400 font-medium">{pwStatus.error}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleUpdatePassword} disabled={pwStatus.loading} className="flex-1 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50">{t('save_pin')}</button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── CAPSULE 2: CORE BUSINESS PARAMETERS ─────────────────────── */}
        <h2 className={`text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-2 mt-6 block px-1 flex items-center gap-1.5`}>
          <Store className="w-3.5 h-3.5" /> {t('core_parameters')}
        </h2>
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black rounded-2xl p-2 space-y-0.5 shadow-sm dark:shadow-none !shadow-none">
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language Switcher Row */}
              <div className="space-y-2 md:col-span-2">
                <label className={`text-xs text-slate-500 pl-1 block ${language === 'ta' ? 'tracking-normal leading-relaxed' : ''}`}>{t('app_language')}</label>
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-black dark:border-black flex items-center w-full max-w-[240px] shadow-sm">
                  <button onClick={() => switchLanguage('en')} className={`${language === 'en' ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white font-bold text-xs shadow-sm border border-slate-200 dark:border-black dark:border-black py-1.5 px-4 rounded-lg flex-1 text-center transition-all' : 'text-slate-500 dark:text-slate-400 font-bold text-xs flex-1 text-center hover:text-slate-900 dark:hover:text-white transition-colors'}`}>English</button>
                  <button onClick={() => switchLanguage('ta')} className={`${language === 'ta' ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white font-bold text-xs shadow-sm border border-slate-200 dark:border-black dark:border-black py-1.5 px-4 rounded-lg flex-1 text-center transition-all' : 'text-slate-500 dark:text-slate-400 font-bold text-xs flex-1 text-center hover:text-slate-900 dark:hover:text-white transition-colors'}`}>தமிழ்</button>
                </div>
              </div>

              {/* Theme Switcher Row */}
              <div className="space-y-2 md:col-span-2">
                <label className={`text-xs text-slate-500 pl-1 block ${language === 'ta' ? 'tracking-normal leading-relaxed' : ''}`}>
                  {language === 'ta' ? 'பயன்பாட்டு தீம்' : 'Application Theme'}
                </label>
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-black dark:border-black flex items-center w-full max-w-[240px] shadow-sm">
                  <button onClick={() => setThemeMode('light')} className={`${themeMode === 'light' ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white font-bold text-xs shadow-sm border border-slate-200 dark:border-black dark:border-black py-1.5 px-4 rounded-lg flex-1 text-center transition-all' : 'text-slate-500 dark:text-slate-400 font-bold text-xs flex-1 text-center hover:text-slate-900 dark:hover:text-white transition-colors'}`}>
                    {language === 'ta' ? 'ஒளி' : 'Light'}
                  </button>
                  <button onClick={() => setThemeMode('dark')} className={`${themeMode === 'dark' ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white font-bold text-xs shadow-sm border border-slate-200 dark:border-black dark:border-black py-1.5 px-4 rounded-lg flex-1 text-center transition-all' : 'text-slate-500 dark:text-slate-400 font-bold text-xs flex-1 text-center hover:text-slate-900 dark:hover:text-white transition-colors'}`}>
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
                  className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white border border-slate-200 dark:border-black dark:border-black focus:border-slate-400 dark:focus:border-slate-500 focus:ring-0 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-shadow placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── CAPSULE 3: CATEGORY ARCHITECTURE ENGINE ─────────────────── */}
        <h2 className={`text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-2 mt-6 block px-1 flex items-center gap-1.5`}>
          <Tags className="w-3.5 h-3.5" /> {t('category_architecture')}
        </h2>
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black rounded-2xl p-2 space-y-0.5 shadow-sm dark:shadow-none !shadow-none">
          <div className="p-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-black dark:border-black mb-4 shadow-sm">
              <button onClick={() => setActiveCatTab('income')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCatTab === 'income' ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-black dark:border-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                {t('income_categories')}
              </button>
              <button onClick={() => setActiveCatTab('expense')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCatTab === 'expense' ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-black dark:border-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                {t('expense_categories')}
              </button>
            </div>

            <div className={`flex items-center gap-2 w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black focus-within:border-slate-400 dark:focus-within:border-slate-500 rounded-xl p-1 mb-4 transition-colors shadow-sm`}>
              <input
                type="text"
                value={newCustomCat}
                onChange={(e) => setNewCustomCat(e.target.value)}
                placeholder={t('add_custom_category')}
                className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-900 dark:text-white font-bold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}
              />
              <button
                onClick={handleAddCustomCategory}
                className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 transition-transform text-white font-bold px-4 py-2 rounded-xl shadow-sm text-xs flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeCategoriesList.map(cat => (
                <div key={cat} className={`group bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white border border-slate-200 dark:border-black dark:border-black text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm ${language === 'ta' ? 'tracking-normal leading-relaxed' : ''}`}>
                  {tc(cat)}
                  <button
                    onClick={() => {
                      if(window.confirm(language === 'ta' ? `வகை "${tc(cat)}"-ஐ நீக்கவா?` : `Delete category "${cat}"?`)) deleteCustomCategory(cat);
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
        <h3 className="text-slate-500 text-xs font-black tracking-widest uppercase mb-4 mt-6 block px-1 flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5" /> {language === 'ta' ? 'தானியங்கி நினைவூட்டல்கள்' : 'Automated Reminders'}
        </h3>
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-black dark:border-black rounded-2xl shadow-sm dark:shadow-none !shadow-none">
          <div className="p-5">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-black dark:border-black mb-4 shadow-sm">
              <button onClick={() => setRemType('income')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${remType === 'income' ? 'bg-white dark:bg-[#1e293b] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-black dark:border-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                {t('income_label')}
              </button>
              <button onClick={() => setRemType('expense')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${remType === 'expense' ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-black dark:border-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                {t('expense_label')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <select value={remCat} onChange={e => setRemCat(e.target.value)} className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none col-span-2 focus:border-slate-400 dark:focus:border-slate-500 font-medium">
                <option value="">{t('select_category_placeholder')}</option>
                {customCategories?.filter(c => c.type === remType).map(c => <option key={c.name} value={c.name}>{tc(c.name)}</option>)}
              </select>
              <AmountInput
                value={remAmount}
                onChange={e => setRemAmount(e.target.value)}
                placeholder={t('amount_label')}
                className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none w-full focus:border-slate-400 dark:focus:border-slate-500 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <select value={frequency} onChange={e => setFrequency(e.target.value)} className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none w-full focus:border-slate-400 dark:focus:border-slate-500 font-medium">
                <option value="daily">{t('daily')}</option>
                <option value="weekly">{t('weekly')}</option>
                <option value="monthly">{t('monthly')}</option>
                <option value="end_of_month">{t('end_of_month')}</option>
              </select>
              
              {frequency === 'weekly' && (
                <select value={selectedDayOfWeek} onChange={e => setSelectedDayOfWeek(Number(e.target.value))} className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none col-span-2 focus:border-slate-400 dark:focus:border-slate-500 font-medium">
                  <option value={1}>{t('monday')}</option>
                  <option value={2}>{t('tuesday')}</option>
                  <option value={3}>{t('wednesday')}</option>
                  <option value={4}>{t('thursday')}</option>
                  <option value={5}>{t('friday')}</option>
                  <option value={6}>{t('saturday')}</option>
                  <option value={7}>{t('sunday')}</option>
                </select>
              )}
              {frequency === 'monthly' && (
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={selectedDayOfMonth}
                  onChange={e => setSelectedDayOfMonth(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={t('day_placeholder')}
                  className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none col-span-2 focus:border-slate-400 dark:focus:border-slate-500 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              )}
            </div>
            
            <button 
              onClick={handleAddReminder} 
              disabled={isSubmitting || !remCat || !remAmount || (frequency === 'weekly' && !selectedDayOfWeek) || (frequency === 'monthly' && !selectedDayOfMonth)} 
              className={`w-full font-black text-sm py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] mt-5 cursor-pointer border-none select-none disabled:opacity-40 disabled:cursor-not-allowed
                ${isSubmitting 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
                  : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600'
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent dark:border-slate-400 rounded-full animate-spin"></div>
                  <span>{t('saving')}</span>
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> 
                  <span>{t('add_reminder_btn')}</span>
                </>
              )}
            </button>

            <div className="mt-6 space-y-2">
              {(recurringReminders || []).map(rem => (
                <div key={rem.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-black dark:border-black p-3 rounded-xl shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rem.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{tc(rem.category)}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {rem.frequency === 'daily' ? (language === 'ta' ? 'ஒவ்வொரு நாளும்' : 'Every day') : 
                       rem.frequency === 'weekly' ? (language === 'ta' ? `ஒவ்வொரு வாரமும் ${[t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')][rem.day - 1]}` : `Every week on ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][rem.day - 1]}`) :
                       rem.frequency === 'end_of_month' ? t('end_of_month') :
                       rem.frequency === 'monthly' ? (language === 'ta' ? `ஒவ்வொரு மாதமும் ${rem.day} அன்று` : `Every month on day ${rem.day}`) :
                       (language === 'ta' ? `ஒவ்வொரு மாதமும் ${rem.day} அன்று` : `Every month on day ${rem.day}`)} • ₹{rem.amount}
                    </div>
                  </div>
                  <button onClick={() => { if(window.confirm(language === 'ta' ? 'நினைவூட்டலை நீக்கவா?' : 'Delete reminder?')) deleteRecurringReminder(rem.id); }} className="text-slate-400 hover:text-rose-500 transition-colors p-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CAPSULE 5: DEVELOPER PORTFOLIO & REPO ──────────────────────── */}
        <h2 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-2 mt-8 block px-1 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          {language === 'ta' ? 'டெவலப்பர் & சோர்ஸ் கோட்' : 'Developer & Source Code'}
        </h2>
        <div className="bg-slate-900 dark:bg-gradient-to-r dark:from-slate-900 dark:to-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg overflow-hidden relative group">
          {/* Decorative background glow */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full group-hover:bg-emerald-500/30 transition-all duration-500"></div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-white text-sm font-black flex items-center gap-2">
                Expenza v3.0 Pro 🚀
              </h3>
              <p className="text-slate-400 text-xs font-medium mt-1 leading-relaxed max-w-[250px]">
                {language === 'ta' 
                  ? 'இந்த ப்ராஜெக்ட் உங்களுக்கு பிடித்திருந்தால், GitHub-ல் ஒரு ஸ்டார் (⭐) கொடுக்கவும்!' 
                  : 'If you like this project architecture, consider giving it a star on GitHub!'}
              </p>
            </div>

            <a 
              href="https://github.com/Gowtham380/Expense-tracker-2" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              className="flex items-center gap-2 hover:bg-slate-100 hover:scale-105 transition-all active:scale-95 px-4 py-2.5 rounded-xl font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.1)] whitespace-nowrap"
            >
              <Star className="w-4 h-4" style={{ fill: '#0f172a', stroke: '#0f172a' }} /> 
              Star on GitHub
            </a>
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
