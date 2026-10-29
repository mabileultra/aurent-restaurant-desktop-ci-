import React, { useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Info,
  Send,
} from 'lucide-react';

export default function PlatformDesktopConfirmModal({ p }) {
  const { t } = p;
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  // Manage body scroll lock and focus trap
  useEffect(() => {
    if (!p.confirmModalOpen) return;

    lastActiveElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus initial button
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
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
    };
  }, [p.confirmModalOpen]);

  if (!p.confirmModalOpen) return null;

  const handleClose = () => {
    p.setConfirmModalOpen(false);
    setTimeout(() => {
      if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
        lastActiveElementRef.current.focus();
      }
    }, 50);
  };

  const handleAddTranslation = () => {
    p.setConfirmModalOpen(false);
    p.setLangTab('ru');
    setTimeout(() => {
      document.getElementById('broadcast-title-input')?.focus();
    }, 100);
  };

  const activeTitle = p.titleUz.trim() || p.titleRu.trim();
  const activeBody = p.bodyUz.trim() || p.bodyRu.trim();

  const isUzFilled = Boolean(p.titleUz.trim() && p.bodyUz.trim());
  const isRuFilled = Boolean(p.titleRu.trim() && p.bodyRu.trim());

  const isAlert = p.kind === 'ALERT';
  const isUpdate = p.kind === 'UPDATE';

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-broadcast-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 id="confirm-broadcast-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('platform.desktopNotifications.confirmModalTitle', { count: p.totalRegistersCount })}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('platform.desktopNotifications.confirmModalSubtitle')}
            </p>
          </div>
        </div>

        {/* Summary Details Grid */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 dark:text-slate-400">
              {t('platform.desktopNotifications.confirmLabelTarget')}
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {t('platform.desktopNotifications.targetAll')} · {p.totalRegistersCount} ta
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 dark:text-slate-400">
              {t('platform.desktopNotifications.confirmLabelKind')}
            </span>
            <div className="flex items-center gap-1.5">
              {isAlert && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                  {t('platform.desktopNotifications.kindAlert')}
                </span>
              )}
              {isUpdate && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                  {t('platform.desktopNotifications.kindUpdate')}
                </span>
              )}
              {!isAlert && !isUpdate && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  {t('platform.desktopNotifications.kindMessage')}
                </span>
              )}
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                {isAlert ? 'kassir yopmaguncha ekranda turadi' : 'bildirishnomalarda chiqadi'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 dark:text-slate-400">
              {t('platform.desktopNotifications.confirmLabelLanguages')}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                  isUzFilled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                O‘zbekcha · {isUzFilled ? 'to‘liq' : 'bo‘sh'}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                  isRuFilled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                Русский · {isRuFilled ? 'to‘liq' : 'bo‘sh'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 dark:text-slate-400">
              {t('platform.desktopNotifications.confirmLabelExpires')}
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {p.visibleUntilFormatted} gacha
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 dark:text-slate-400">
              {t('platform.desktopNotifications.confirmLabelSendTime')}
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {p.scheduleType === 'NOW' ? 'Hozir' : 'Rejalashtirilgan'}
            </span>
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-850 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">
            {t('platform.desktopNotifications.confirmCashierPreview')}
          </p>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            {activeTitle}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
            {activeBody}
          </p>
        </div>

        {/* Russian Translation Warning Banner */}
        {!isRuFilled && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
            <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span>{t('platform.desktopNotifications.confirmRuWarning')}</span>{' '}
              <button
                type="button"
                onClick={handleAddTranslation}
                className="font-bold text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 inline cursor-pointer"
              >
                {t('platform.desktopNotifications.confirmAddTranslation')}
              </button>
            </div>
          </div>
        )}

        {/* Warning Footnote */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('platform.desktopNotifications.confirmFootnote')}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            {t('platform.desktopNotifications.confirmCancel')}
          </button>
          <button
            type="button"
            onClick={p.executeBroadcast}
            disabled={p.sendPending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send size={15} />
            <span>{t('platform.desktopNotifications.confirmSubmit', { count: p.totalRegistersCount })}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
