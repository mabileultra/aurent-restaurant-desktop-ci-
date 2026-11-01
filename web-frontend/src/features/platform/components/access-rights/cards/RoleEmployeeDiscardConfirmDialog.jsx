import React, { useEffect, useRef } from 'react';
import { trapFocus } from '../utils/focusTrapUtils';

/**
 * Xodim huquqlarini tahrirlashda saqlanmagan o'zgarishlarni bekor qilish tasdig'i (SRP)
 */
export default function RoleEmployeeDiscardConfirmDialog({
  isOpen,
  onStay,
  onDiscard,
}) {
  const stayButtonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => stayButtonRef.current?.focus(), 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onStay?.();
      } else if (e.key === 'Tab') {
        trapFocus(e, dialogRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-confirm-title"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <h4 id="discard-confirm-title" className="text-sm font-bold text-slate-900 dark:text-white">
          Saqlanmagan o‘zgarishlar mavjud
        </h4>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Kiritilgan o‘zgarishlar saqlanmadi. Chiqib ketsangiz, ular yo‘qoladi. Davom ettirasizmi?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={stayButtonRef}
            type="button"
            onClick={onStay}
            className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Qolish
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            O‘zgarishlarni bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
}
