import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useExpense } from '../context/ExpenseContext';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function UpdatePassword({ onClose }) {
  const { setSecurePin, themeMode, t } = useExpense();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (pin.length !== 4 || confirm.length !== 4) {
      setErrorMsg(t('pin_length_error') || 'PIN must be exactly 4 digits!');
      return;
    }

    if (pin !== confirm) {
      setErrorMsg(t('pins_do_not_match') || 'PINs do not match!');
      return;
    }

    setLoading(true);
    try {
      // 1. Force Supabase to update password in auth schema (appended with suffix to bypass 6-char limit)
      const { error } = await supabase.auth.updateUser({ password: pin + "_expenza" });
      if (error) throw error;

      // 2. Update custom PIN state (which syncs to user_settings table)
      await setSecurePin(pin);
      
      alert(t('pin_updated_success') || 'PIN updated successfully!');
      if (onClose) onClose();
      window.location.href = '/';
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update PIN.');
    } finally {
      setLoading(false);
    }
  };

  const isDark = themeMode === 'dark';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in transition-colors duration-500 ${isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`w-full max-w-md space-y-8 glass-premium rounded-3xl p-10 flex flex-col items-center relative overflow-hidden shadow-2xl border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        
        {/* Background Glow Effect */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`}></div>

        {/* Brand Icon */}
        <div className={`relative z-10 p-5 rounded-full shadow-lg border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
          <Lock className="w-14 h-14" />
        </div>
        
        {/* Typography */}
        <div className="text-center space-y-2 relative z-10">
          <h1 className="text-3xl font-black tracking-tighter">
            {isDark ? 'SET NEW PIN' : 'புதிய பின்'}
          </h1>
          <p className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Secure Access Recovery
          </p>
        </div>

        {errorMsg && (
          <div className="w-full text-center text-xs font-bold text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUpdate} className="w-full space-y-4 relative z-10">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>New 4-Digit PIN</label>
            <input 
              type="password" 
              inputMode="numeric" 
              pattern="[0-9]*"
              maxLength={4} 
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))} 
              placeholder="••••" 
              className={`w-full p-4 rounded-xl text-center text-2xl font-black tracking-[1em] focus:outline-none border transition-all ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500/50' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
              required
            />
          </div>

          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Confirm 4-Digit PIN</label>
            <input 
              type="password" 
              inputMode="numeric" 
              pattern="[0-9]*"
              maxLength={4} 
              value={confirm}
              onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))} 
              placeholder="••••" 
              className={`w-full p-4 rounded-xl text-center text-2xl font-black tracking-[1em] focus:outline-none border transition-all ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500/50' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl py-4 px-6 flex items-center justify-center gap-3 font-extrabold text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-md ${
              loading 
                ? 'opacity-50 cursor-not-allowed' 
                : isDark 
                  ? 'bg-[#ffffff] text-slate-900 hover:bg-slate-100' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {loading ? 'Updating...' : 'Update PIN'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        
        {/* Security Badge */}
        <div className={`flex items-center gap-1.5 text-[11px] font-bold tracking-widest mt-6 pt-6 border-t w-full justify-center uppercase relative z-10 ${isDark ? 'border-white/5 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Encryption
        </div>

      </div>
    </div>
  );
}
