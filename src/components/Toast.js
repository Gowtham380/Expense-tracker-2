import React, { useState, useEffect, useCallback } from 'react';

const ICONS = {
  success: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const STYLES = {
  success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
  error:   'bg-rose-500/20   border-rose-500/50   text-rose-300',
  warning: 'bg-amber-500/20  border-amber-500/50  text-amber-300',
  info:    'bg-indigo-500/20 border-indigo-500/50 text-indigo-300',
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const toast = e.detail;
      setToasts((prev) => [...prev.slice(-4), toast]); // max 5 visible
      setTimeout(() => dismiss(toast.id), toast.duration ?? 3500);
    };
    window.addEventListener('show-toast', handler);
    return () => window.removeEventListener('show-toast', handler);
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] px-4 pointer-events-none flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-in slide-in-from-top-4 fade-in p-4 rounded-xl shadow-lg border flex items-center gap-3 w-full max-w-sm ${
            t.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {ICONS[t.type]}
          <span className="font-medium text-sm flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="ml-auto opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
