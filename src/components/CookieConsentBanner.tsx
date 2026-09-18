import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check } from 'lucide-react';
import { getResilientStorageItem, setResilientStorageItem, syncStorageWithCookies } from '../utils/secureCookie';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Synchronize storage layers across privacy shields (Brave, Edge, Firefox)
    syncStorageWithCookies();

    const consent = getResilientStorageItem('dakshyam_cookie_consent');
    if (!consent) {
      // Delay showing banner slightly to avoid layout jump
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    setResilientStorageItem('dakshyam_cookie_consent', 'accepted_all', 180);
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    setResilientStorageItem('dakshyam_cookie_consent', 'essential_only', 180);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999990] max-w-sm w-[calc(100%-2rem)] sm:w-96 animate-slideUp pointer-events-auto"
      role="region"
      aria-label="Privacy & Cookie Preferences"
    >
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-emerald-500/30 text-white shadow-2xl shadow-black/80 space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-3xs font-mono uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" />
                Privacy & Cache
              </span>
              <span className="text-slate-400 text-3xs font-mono">• Edge & Brave Ready</span>
            </div>
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-tight">
              Cookie & Cache Optimization
            </h4>
          </div>
        </div>

        <p className="text-2xs text-slate-300 leading-relaxed">
          We use secure first-party cookies and modern local storage caching to maintain your session credentials, dark/light theme, and ensure zero-lag navigation across Microsoft Edge, Brave, Chrome, and Safari.
        </p>

        <div className="flex items-center gap-2 pt-1 font-mono text-2xs">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept All</span>
          </button>

          <button
            type="button"
            onClick={handleAcceptEssential}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 font-bold transition-all cursor-pointer"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
};
