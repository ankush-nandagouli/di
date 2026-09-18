import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, X } from 'lucide-react';
import { SecurityGuard, SecurityEventDetail } from '../utils/security';

export const SecurityToast: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<SecurityEventDetail | null>(null);

  useEffect(() => {
    // Initialize the security guard listeners
    SecurityGuard.init();

    // Subscribe to violation notifications
    const unsubscribe = SecurityGuard.subscribe((event) => {
      setActiveAlert(event);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  if (!activeAlert) return null;

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] max-w-md w-[92%] sm:w-auto animate-bounceIn pointer-events-auto"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-rose-500/40 text-white shadow-2xl shadow-rose-950/40">
        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
          {activeAlert.type === 'RIGHT_CLICK' ? (
            <Lock className="w-4 h-4" />
          ) : (
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-3xs font-mono font-black uppercase tracking-wider text-rose-400">
              Security Notice
            </span>
            <span className="text-slate-500 text-3xs">• Protected</span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-snug">
            {activeAlert.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveAlert(null)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
