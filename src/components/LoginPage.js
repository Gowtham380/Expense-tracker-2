import React from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, ShieldCheck } from 'lucide-react'; // Store-க்கு பதிலா Wallet ஐகான்

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
           redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      alert("Error logging in: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col items-center justify-center p-6 animate-in fade-in">
      <div className="w-full max-w-md space-y-8 glass-premium rounded-3xl p-10 flex flex-col items-center relative overflow-hidden">
        
        {/* Background Glow Effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-neonEmerald/10 blur-3xl rounded-full"></div>

        {/* Brand Icon */}
        <div className="relative z-10 bg-neonEmerald/10 p-5 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-neonEmerald/20">
          <Wallet className="w-14 h-14 text-neonEmerald" />
        </div>
        
        {/* Professional Typography */}
        <div className="text-center space-y-2 relative z-10">
          <h1 className="text-4xl font-black tracking-tighter">
            EXPENZA <span className="text-neonEmerald">PRO</span>
          </h1>
          <p className="text-slate-400 font-bold text-xs tracking-[0.2em] uppercase">
            Advanced Financial Engine
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full pt-6 relative z-10">
           <button 
             onClick={handleGoogleLogin}
             style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
             className="w-full border border-transparent rounded-xl py-4 px-6 flex items-center justify-center gap-3 font-extrabold text-lg hover:bg-slate-100 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
           >
             <svg className="w-6 h-6" viewBox="0 0 24 24">
               <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
               <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
               <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
               <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
             </svg>
             Continue with Google
           </button>
        </div>
        
        {/* Security Badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-slate-500 mt-6 pt-6 border-t border-white/5 w-full justify-center uppercase relative z-10">
           <ShieldCheck className="w-4 h-4 text-neonEmerald" /> 256-Bit Cloud Encryption
        </div>

      </div>
    </div>
  );
}