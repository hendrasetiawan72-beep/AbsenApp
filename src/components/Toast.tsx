import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div
      id="toast-container"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-lg border backdrop-blur-md text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 text-emerald-50 border-emerald-700/60 shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'bg-rose-900/95 text-rose-50 border-rose-700/60 shadow-rose-950/20'
                : 'bg-slate-900/95 text-slate-50 border-slate-700/60 shadow-slate-950/20'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-indigo-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1 leading-snug">
              {toast.message}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="shrink-0 text-white/60 hover:text-white p-0.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
