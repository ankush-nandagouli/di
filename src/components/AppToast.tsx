import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X, ShieldAlert } from 'lucide-react';
import { ToastPayload } from '../utils/toast';

interface AppToastProps {
  theme?: 'dark' | 'light';
}

export const AppToast: React.FC<AppToastProps> = ({ theme = 'dark' }) => {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);
  const isLight = theme === 'light';

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;
      setToasts(prev => [newToast, ...prev.slice(0, 4)]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, newToast.duration);
      }
    };

    window.addEventListener('dakshyam-toast', handleToastEvent);
    return () => window.removeEventListener('dakshyam-toast', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast, tIdx) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <motion.div
              key={toast.id ? `${toast.id}-${tIdx}` : `toast-${tIdx}`}
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md ${
                isSuccess
                  ? isLight
                    ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                    : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                  : isError
                  ? isLight
                    ? 'bg-rose-50/95 border-rose-300 text-rose-950'
                    : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                  : isWarning
                  ? isLight
                    ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                    : 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                  : isLight
                  ? 'bg-blue-50/95 border-blue-200 text-blue-950'
                  : 'bg-blue-950/90 border-blue-500/40 text-sky-200'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {isError && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                {isWarning && <ShieldAlert className="w-4 h-4 text-amber-500" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-sky-400" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h5 className="font-mono text-2xs font-bold uppercase tracking-wider mb-0.5">
                    {toast.title}
                  </h5>
                )}
                <p className="text-xs font-sans font-medium leading-relaxed break-words">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
