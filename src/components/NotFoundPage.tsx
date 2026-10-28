import React from 'react';
import { motion } from 'motion/react';
import { Home, Compass, ShieldCheck, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import DakshyamLogo from './DakshyamLogo';

interface NotFoundPageProps {
  theme: 'dark' | 'light';
  onNavigateTab: (tab: 'home' | 'services' | 'social' | 'portal' | 'about' | 'contact' | 'notfound') => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ theme, onNavigateTab }) => {
  const isLight = theme === 'light';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 text-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-2xl w-full mx-auto space-y-8"
      >
        {/* Subtle Tech Logo Preview */}
        <div className="flex justify-center items-center scale-90 sm:scale-100">
          <DakshyamLogo theme={theme} />
        </div>

        {/* 404 Glitch Badge & Code */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-xs font-black tracking-widest uppercase">
            <span className={`w-2 h-2 rounded-full animate-ping ${isLight ? 'bg-amber-600' : 'bg-amber-400'}`} />
            <span className={isLight ? 'text-amber-900' : 'text-amber-300'}>
              ERROR 404 • ROUTE UNRESOLVED
            </span>
          </div>

          <h1 className={`text-4xl sm:text-6xl font-black font-mono tracking-tight uppercase ${
            isLight ? 'text-blue-950' : 'text-white'
          }`}>
            404 NOT FOUND
          </h1>

          <p className={`text-sm sm:text-base font-medium max-w-lg mx-auto leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>
            The requested destination on <span className="font-mono font-bold">dakshyaminnovations.in</span> does not exist or has been relocated to another curriculum track.
          </p>
        </div>

        {/* Action Directives Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg mx-auto pt-2">
          <button
            onClick={() => onNavigateTab('home')}
            className={`flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-mono text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer active:scale-95 shadow-sm ${
              isLight
                ? 'bg-blue-950 hover:bg-blue-900 text-white'
                : 'bg-white hover:bg-slate-100 text-[#0a192f]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </button>

          <button
            onClick={() => onNavigateTab('services')}
            className={`flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase border transition-all duration-200 cursor-pointer active:scale-95 ${
              isLight
                ? 'border-blue-900/20 bg-blue-50/80 hover:bg-blue-100/80 text-blue-950'
                : 'border-blue-700/40 bg-blue-950/40 hover:bg-blue-900/60 text-sky-300'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Browse Programs</span>
          </button>

          <button
            onClick={() => onNavigateTab('portal')}
            className={`flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase border transition-all duration-200 cursor-pointer active:scale-95 ${
              isLight
                ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                : 'border-slate-800 bg-[#071326] hover:bg-[#0d2242] text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Innovation Portal</span>
          </button>

          <button
            onClick={() => onNavigateTab('contact')}
            className={`flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase border transition-all duration-200 cursor-pointer active:scale-95 ${
              isLight
                ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                : 'border-slate-800 bg-[#071326] hover:bg-[#0d2242] text-slate-300'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Contact Desk</span>
          </button>
        </div>

        {/* Mission Footer Note */}
        <div className="pt-4 flex items-center justify-center gap-2 font-mono text-2xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Dakshyam Innovations • Learn • Build • Innovate</span>
        </div>
      </motion.div>
    </div>
  );
};
