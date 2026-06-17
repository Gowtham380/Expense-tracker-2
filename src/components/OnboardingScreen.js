import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { supabase } from '../supabaseClient';
import { User, Globe, Check, ArrowRight, Activity, Sun, Moon, Briefcase, Store, Sparkles, Lock } from 'lucide-react';
import ExpenzaLogo from '../assets/expenza-logo.png';

export default function OnboardingScreen() {
  const { session, switchLanguage, setSecurePin, setThemeMode, setUserProfile, categoryBudgets } = useExpense();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [userType, setUserType] = useState(''); // 'salary' or 'business'
  const [frequency, setFrequency] = useState('monthly'); // 'daily', 'weekly', 'monthly'
  const [theme, setTheme] = useState('dark'); // Default to dark for a stunning onboarding, will switch based on choice
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep1 = () => {
    if (!name.trim()) return alert('Please enter your name');
    switchLanguage(selectedLang);
    setCurrentStep(2);
  };

  const handleSelectUserType = (type) => {
    setUserType(type);
    if (type === 'salary') {
      setFrequency('monthly');
      // Delay slightly for smooth transitions
      setTimeout(() => {
        setCurrentStep(3);
      }, 300);
    }
  };

  const handleNextStep2 = () => {
    if (!userType) return alert('Please select your user type.');
    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError(selectedLang === 'ta' ? 'PIN 4 எண்கள் கொண்டதாக இருக்க வேண்டும்!' : 'PIN must be exactly 4 digits!');
      return;
    }
    if (pin !== confirmPin) {
      setPinError(selectedLang === 'ta' ? 'PIN-கள் பொருந்தவில்லை!' : 'PINs do not match!');
      return;
    }
    setPinError('');
    setIsSubmitting(true);
    
    // Default Fallbacks constraint: if not selected or defaulted
    const finalLanguage = selectedLang || 'en';
    const finalTheme = theme || 'light';
    const finalFrequency = userType === 'salary' ? 'monthly' : frequency;

    const finalProfile = {
      name: name.trim(),
      type: userType,
      frequency: finalFrequency,
      language: finalLanguage,
      theme: finalTheme
    };

    // Update state & settings locally
    setUserProfile(finalProfile);
    switchLanguage(finalLanguage);
    setThemeMode(finalTheme);

    const finalPin = pin;

    if (session?.user?.id) {
      try {
        await supabase.auth.updateUser({ data: { full_name: finalProfile.name } });
        await supabase.from('user_settings').upsert({
          user_id: session?.user?.id,
          name: finalProfile.name,
          language: finalLanguage,
          secure_pin: finalPin,
          appmode: finalTheme,
          categorybudgets: {
            ...categoryBudgets,
            __calculation_period: finalFrequency,
            __user_profile: finalProfile
          }
        });
        setSecurePin(finalPin);
      } catch (err) {
        console.error('Error syncing profile settings to cloud:', err);
      }
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-md glass-premium rounded-3xl p-8 space-y-8 relative overflow-hidden">
        {/* Decorative ambient glowing backdrops */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-slate-900/60 flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden backdrop-blur-xl relative">
            <img src={ExpenzaLogo} alt="Expenza Logo" className="w-16 h-16 object-contain mix-blend-screen opacity-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {currentStep === 1 
              ? (selectedLang === 'ta' ? 'சுயவிவர அமைவு' : 'Profile Setup')
              : currentStep === 2 
              ? (selectedLang === 'ta' ? 'பயன்பாட்டு வகை' : 'Income Model')
              : currentStep === 3
              ? (selectedLang === 'ta' ? 'பாதுகாப்பு பின்' : 'Security PIN')
              : (selectedLang === 'ta' ? 'காட்சி அமைவு' : 'Visual Preferences')}
          </h1>
          <p className="text-xs text-slate-400">
            {currentStep === 1 
              ? (selectedLang === 'ta' ? 'உங்கள் பெயர் மற்றும் மொழியைத் தேர்ந்தெடுக்கவும்' : 'Configure baseline identity parameters')
              : currentStep === 2 
              ? (selectedLang === 'ta' ? 'தினசரி வரவை எவ்வாறு கணக்கிடுவது என தேர்வு செய்யவும்' : 'Let us tailor calculations to your revenue stream')
              : currentStep === 3
              ? (selectedLang === 'ta' ? 'உங்கள் கணக்கைப் பாதுகாக்க 4 இலக்க பின்னை அமைக்கவும்' : 'Secure your financial database with a 4-digit PIN')
              : (selectedLang === 'ta' ? 'விரும்பிய வண்ண அமைப்பைத் தேர்ந்தெடுக்கவும்' : 'Choose how you want the application to feel')}
          </p>
        </div>

        {/* Wizard Form Wrapper */}
        <div className="space-y-6 relative z-10">
          {/* Step 1: Name & Language */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> App Baseline Language
                </label>
                <div className="flex gap-3 p-1 bg-black/20 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => { setSelectedLang('en'); switchLanguage('en'); }}
                    className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${selectedLang === 'en' ? 'bg-white/10 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedLang('ta'); switchLanguage('ta'); }}
                    className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${selectedLang === 'ta' ? 'bg-white/10 text-emerald-400 shadow-sm tracking-normal leading-relaxed' : 'text-slate-500 hover:text-white tracking-normal leading-relaxed'}`}
                  >
                    தமிழ்
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep1}
                className="w-full mt-8 py-3.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm border border-emerald-500/50 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              >
                {selectedLang === 'ta' ? 'தொடரவும்' : 'Continue'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: User Type & Frequency */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> {selectedLang === 'ta' ? 'உங்கள் வருமான வகை' : 'Select Income Model'}
              </label>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectUserType('salary')}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all ${
                    userType === 'salary'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02]'
                      : 'bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Briefcase className="w-8 h-8 mb-3 opacity-80" />
                  <span className="font-bold text-sm">{selectedLang === 'ta' ? 'சம்பளம் (Salary)' : 'Salary'}</span>
                  <span className="text-[10px] text-slate-500 mt-1">{selectedLang === 'ta' ? 'மாதாந்திர வரவு முறை' : 'Auto-sets Monthly Cycle'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectUserType('business')}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all ${
                    userType === 'business'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02]'
                      : 'bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Store className="w-8 h-8 mb-3 opacity-80" />
                  <span className="font-bold text-sm">{selectedLang === 'ta' ? 'வியாபாரம் (Business)' : 'Business'}</span>
                  <span className="text-[10px] text-slate-500 mt-1">{selectedLang === 'ta' ? 'நெகிழ்வான வரவு முறை' : 'Flexible Calculations'}</span>
                </button>
              </div>

              {/* Show frequency selector ONLY if user type is Business */}
              {userType === 'business' && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> {selectedLang === 'ta' ? 'கணக்கீட்டு அதிர்வெண்' : 'Calculation Frequency'}
                  </label>
                  <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
                    {['daily', 'weekly', 'monthly'].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setFrequency(freq)}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                          frequency === freq ? 'bg-white/10 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {userType === 'business' && (
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="w-full mt-6 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  {selectedLang === 'ta' ? 'தொடரவும்' : 'Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Step 3: Theme Selector */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> {selectedLang === 'ta' ? 'தீம் தேர்வு' : 'Select App Theme'}
              </label>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setTheme('light'); setThemeMode('light'); }}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all ${
                    theme === 'light'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.02]'
                      : 'bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Sun className="w-8 h-8 mb-3 opacity-80" />
                  <span className="font-bold text-sm">{selectedLang === 'ta' ? 'வெளிச்சம் (Light)' : 'Light Theme'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setTheme('dark'); setThemeMode('dark'); }}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all ${
                    theme === 'dark'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02]'
                      : 'bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Moon className="w-8 h-8 mb-3 opacity-80" />
                  <span className="font-bold text-sm">{selectedLang === 'ta' ? 'இருள் (Dark)' : 'Dark Theme'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="w-full mt-8 py-3.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm border border-emerald-500/50 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              >
                {selectedLang === 'ta' ? 'தொடரவும்' : 'Continue'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 4: PIN Setup */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> {selectedLang === 'ta' ? '4-இலக்க பின்னை அமைக்கவும்' : 'Set 4-Digit Secure PIN'}
                </label>
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPin(val);
                  }}
                  placeholder="••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-center text-2xl tracking-[1em] text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> {selectedLang === 'ta' ? 'பின்னை உறுதிப்படுத்தவும்' : 'Confirm PIN'}
                </label>
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setConfirmPin(val);
                  }}
                  placeholder="••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-center text-2xl tracking-[1em] text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {pinError && (
                <div className="text-rose-500 text-xs font-bold text-center mt-2 animate-pulse">
                  {pinError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full mt-8 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                   <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                ) : (
                  <>
                    {selectedLang === 'ta' ? 'அமைப்பை முடித்துத் தொடங்கவும்' : 'Complete Setup & Launch'} <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className={`h-1.5 rounded-full transition-all ${step === currentStep ? 'w-6 bg-emerald-400' : step < currentStep ? 'w-2 bg-emerald-500/50' : 'w-2 bg-white/10'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
