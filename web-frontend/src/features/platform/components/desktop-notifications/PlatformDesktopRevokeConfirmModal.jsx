import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { NotificationKindBadge } from './DesktopNotificationBadges';

export default function PlatformDesktopRevokeConfirmModal({ p }) {
  const { t } = p;
  const item = p.revokeConfirmItem;
  const isOpen = Boolean(item);
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    lastActiveElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        p.setRevokeConfirmItem(null);
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown, true);
      lastActiveElementRef.current?.focus?.();
    };
  }, [isOpen, p]);

  if (!isOpen || !item) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoke-confirm-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 id="revoke-confirm-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t('platform.desktopNotifications.revokeConfirmTitle', { defaultValue: 'Xabarni kassalardan olib tashlash' })}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('platform.desktopNotifications.revokeConfirmSubtitle', {
                  defaultValue: 'Haqiqatan ham ushbu xabarni barcha kassalardan muddatidan oldin olib tashlamoqchimisiz?',
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => p.setRevokeConfirmItem(null)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            aria-label={t('common.close', { defaultValue: 'Yopish' })}
          >
            <X size={18} />
          </button>
        </div>

        {/* Target notification preview card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850 space-y-1.5">
          <div className="flex items-center gap-2">
            <NotificationKindBadge kind={item.kind} t={t} size="xs" />
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {item.title}
            </span>
          </div>
          {item.body && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {item.body}
            </p>
          )}
        </div>

        {/* Warning text */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 leading-relaxed">
          {t('platform.desktopNotifications.revokeConfirmNotice', {
            defaultValue: 'Ushbu amal bajarilgach, xabar darhol barcha faol kassa ekranlaridan yo‘qoladi va qayta tiklanmaydi.',
          })}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={() => p.setRevokeConfirmItem(null)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t('common.cancel', { defaultValue: 'Bekor qilish' })}
          </button>
          <button
            type="button"
            onClick={p.handleConfirmRevoke}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
            <span>{t('platform.desktopNotifications.actionRevoke', { defaultValue: 'Kassalardan olib tashlash' })}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body
    ? createPortal(modalNode, document.body)
    : modalNode;
}
