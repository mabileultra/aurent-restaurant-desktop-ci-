import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Xodimni shablonga qaytarishdan oldingi tasdiqlash dialogi
 * role="dialog", aria-modal, avtofokus va Escape boshqaruvi bilan
 */
export default function RoleEmployeeResetConfirmDialog({
  user,
  onCancel,
  onConfirm,
  isResetting = false,
}) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (!isResetting) onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, onCancel, isResetting]);

  if (!user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      className="p-4 border-t border-amber-200 bg-amber-50/95 dark:border-amber-900 dark:bg-amber-950/90 animate-in fade-in duration-150"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={18} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <p id="reset-dialog-title" className="font-bold text-slate-900 dark:text-white">
            {user.fullName || user.username} shablonga qaytarilsinmi?
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5">
            Xodimning barcha individual istisnolari o‘chiriladi va rolning standart huquqlari tiklanadi.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              ref={cancelBtnRef}
              type="button"
              disabled={isResetting}
              onClick={onCancel}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              disabled={isResetting}
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isResetting && <Loader2 size={12} className="animate-spin" />}
              <span>{isResetting ? 'Qaytarilmoqda...' : 'Ha, qaytarilsin'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
