import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useStudySpace } from '../context/StudySpaceContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useStudySpace();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium transition-all duration-200 ${
              isError
                ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800'
                : isWarning
                ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800'
                : isInfo
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-hairline)]'
                : 'bg-[#344E41] text-white border-[#344E41]'
            }`}
          >
            {isError || isWarning ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : isInfo ? (
              <Info className="w-4 h-4 shrink-0 text-[#A3B18A]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#DDE5D2]" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="p-1 rounded-lg opacity-75 hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
