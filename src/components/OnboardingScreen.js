import React, { useState, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { supabase } from '../supabaseClient';
import { ShieldCheck, User, Globe, Plus, Check, ArrowRight } from 'lucide-react';
import ExpenzaLogo from '../assets/expenza-logo.png';

export default function OnboardingScreen({ missingCategories }) {
  const { session, switchLanguage, securePin, setSecurePin, customCategories, addCustomCategory, deleteCustomCategory, language } = useExpense();
  
  const [currentStep, setCurrentStep] = useState(missingCategories && securePin ? 2 : 1);
  const [name, setName] = useState(session?.user?.user_metadata?.full_name || '');
  const [selectedLang, setSelectedLang] = useState('en');
  const [pin, setPin] = useState(['', '', '', '']);
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) pinRefs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) pinRefs[index - 1].current?.focus();
  };

  const expenseCount = (customCategories || []).filter(c => c.type === 'expense').length;
  const incomeCount = (customCategories || []).filter(c => c.type === 'income').length;

  const handleNextStep1 = () => {
    const finalPin = pin.join('');
    if (!name.trim()) return alert('Please enter your name');
    if (finalPin.length < 4) return alert('Please enter a 4-digit PIN');
    switchLanguage(selectedLang);
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    if (incomeCount < 1) return alert('Please select at least 1 income category.');
    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    if (expenseCount < 1) return alert('Please select at least 1 expense category.');

    setIsSubmitting(true);
    
    const finalPin = pin.join('');
    
    if (!securePin) {
      await supabase.auth.updateUser({ data: { full_name: name } });
      await supabase.from('user_settings').upsert({
        user_id: session?.user?.id,
        name: name,
        language: selectedLang,
        secure_pin: finalPin
      });
      setSecurePin(finalPin);
    } else {
      // Just saving categories via the addCustomCategory context hooks handles it locally
      // but let's make sure it's fully synced if needed.
    }
    
    setIsSubmitting(false);
  };

  const renderCategoryPill = (cat, type, translation) => {
    const isAdded = customCategories.some(c => c.name === cat && c.type === type);
    return (
      <button
        key={cat}
        onClick={() => isAdded ? deleteCustomCategory(cat) : addCustomCategory({ name: cat, type })}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
          isAdded
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.02]'
            : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:bg-white/[0.05] hover:text-white hover:scale-[1.02]'
        }`}
      >
        <span className={language === 'ta' ? 'tracking-normal leading-relaxed' : ''}>{translation}</span>
        {isAdded ? <Check className="w-4 h-4 ml-auto" /> : <Plus className="w-4 h-4 ml-auto opacity-50" />}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-sm glass-card border border-white/10 rounded-3xl p-8 space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-slate-900/60 flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden backdrop-blur-xl relative group">
            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <img src={ExpenzaLogo} alt="Expenza Logo" className="w-16 h-16 object-contain mix-blend-screen opacity-90 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {currentStep === 1 ? 'Initial Setup' : currentStep === 2 ? (language === 'ta' ? 'வருமான வகைகள்' : 'Income Categories') : (language === 'ta' ? 'செலவு வகைகள்' : 'Expense Categories')}
          </h1>
          <p className="text-xs text-slate-400">
            {currentStep === 1 ? 'Configure your identity' : currentStep === 2 ? 'Select your primary income streams' : 'Select your common expenses'}
          </p>
        </div>

        <div className="space-y-6 relative z-10">
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> App Baseline Language
                </label>
                <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
                  <button
                    onClick={() => setSelectedLang('en')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${selectedLang === 'en' ? 'bg-white/10 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setSelectedLang('ta')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${selectedLang === 'ta' ? 'bg-white/10 text-emerald-400 shadow-sm tracking-normal leading-relaxed' : 'text-slate-500 hover:text-white tracking-normal leading-relaxed'}`}
                  >
                    தமிழ்
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> 4-Digit Security PIN
                </label>
                <div className="flex justify-between gap-3 px-2">
                  {[0, 1, 2, 3].map(i => (
                    <input
                      key={i}
                      ref={pinRefs[i]}
                      type="password"
                      maxLength={1}
                      value={pin[i]}
                      onChange={e => handlePinChange(i, e.target.value)}
                      onKeyDown={e => handlePinKeyDown(i, e)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-white/[0.03] border border-white/10 focus:border-emerald-500/50 rounded-2xl outline-none transition-all text-emerald-400 shadow-inner"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleNextStep1}
                className="w-full mt-8 py-3.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm border border-emerald-500/50 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                {selectedLang === 'ta' ? 'தொடரவும்' : 'Continue to Setup'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
              <div className="flex flex-col gap-3">
                {renderCategoryPill('Salary', 'income', language === 'ta' ? 'சம்பளம் (Salary)' : 'Salary')}
                {renderCategoryPill('Business', 'income', language === 'ta' ? 'தொழில்/வியாபாரம் (Business)' : 'Business')}
              </div>
              <button
                onClick={handleNextStep2}
                disabled={incomeCount < 1}
                className="w-full mt-6 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {language === 'ta' ? 'அடுத்த படி' : 'Next Step'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
              <div className="flex flex-col gap-3">
                {renderCategoryPill('Food', 'expense', language === 'ta' ? 'உணவு (Food)' : 'Food')}
                {renderCategoryPill('Rent', 'expense', language === 'ta' ? 'வாடகை (Rent)' : 'Rent')}
                {renderCategoryPill('Transport', 'expense', language === 'ta' ? 'போக்குவரத்து (Transport)' : 'Transport')}
                {renderCategoryPill('Utilities', 'expense', language === 'ta' ? 'பயன்பாடுகள் (Utilities)' : 'Utilities')}
                {renderCategoryPill('Misc', 'expense', language === 'ta' ? 'இதர (Misc)' : 'Misc')}
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || expenseCount < 1}
                className="w-full mt-6 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                   <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                ) : (
                  <>
                    {language === 'ta' ? 'அமைப்பை முடித்துத் தொடங்கவும்' : 'Complete Setup & Launch'} <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3].map(step => (
              <div key={step} className={`h-1.5 rounded-full transition-all ${step === currentStep ? 'w-6 bg-emerald-400' : step < currentStep ? 'w-2 bg-emerald-500/50' : 'w-2 bg-white/10'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
