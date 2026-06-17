import React, { useState, useEffect, useCallback } from 'react';
import { useExpense } from '../context/ExpenseContext';

const ICONS = {
  success: (
    <svg className="w-5 h-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 flex-shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 flex-shrink-0 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const toastStyles = {
  light: 'bg-white text-slate-900 border-slate-200/80 shadow-xl',
  dark: 'bg-[#0f172a] text-white border-slate-800 shadow-2xl backdrop-blur-md bg-opacity-95'
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  // Fetch themeMode from useExpense safely
  let themeMode = 'dark';
  try {
    const context = useExpense();
    if (context && context.themeMode) {
      themeMode = context.themeMode;
    }
  } catch (e) {
    // Ignore context error outside of Provider
  }

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const toast = e.detail;
      setToasts((prev) => [...prev.slice(-3), toast]); // Show max 4 toasts
      setTimeout(() => dismiss(toast.id), toast.duration ?? 3500);
    };
    window.addEventListener('show-toast', handler);
    return () => window.removeEventListener('show-toast', handler);
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] pointer-events-none flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-in slide-in-from-bottom-5 fade-in p-4 rounded-2xl border flex items-center gap-3 w-full max-w-sm transition-all duration-300 ${toastStyles[themeMode]}`}
        >
          {ICONS[t.type]}
          <span className="font-bold text-xs flex-1 leading-relaxed">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="ml-auto opacity-60 hover:opacity-100 p-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
