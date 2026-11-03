import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Bell, RefreshCw, Send } from 'lucide-react';
import PlatformDesktopConfirmModalSummary from './PlatformDesktopConfirmModalSummary';

export default function PlatformDesktopConfirmModal({ p }) {
  const { t } = p;
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  useEffect(() => {
    if (!p.confirmModalOpen) return;

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

  const activeTitle = (p.title || p.titleUz || '').trim();
  const activeBody = (p.body || p.bodyUz || '').trim();

  const isAlert = p.kind === 'ALERT';
  const isUpdate = p.kind === 'UPDATE';
  const isSelect = p.targetScope === 'SELECT';
  const targetCount = p.activeRegistersCount ?? p.totalRegistersCount;

  let modalTitle;
  let targetLabel;
  let submitBtnLabel;

  if (isSelect) {
    const isCompanies = p.targetType === 'COMPANIES';
    const count = isCompanies ? p.selectedCompanyIds?.length || 0 : p.selectedStoreIds?.length || 0;
    modalTitle = t('platform.desktopNotifications.confirmModalTitleSelected', {
      count,
      defaultValue: `Tanlangan ${count} ta ob'ektga yuborilsinmi?`,
    });
    targetLabel = isCompanies
      ? `${t('platform.desktopNotifications.targetTypeCompanies', { defaultValue: "Kompaniyalar bo'yicha" })}: ${count} ta (${t('platform.desktopNotifications.allAssociatedRegisters', { defaultValue: 'barcha kassalari' })})`
      : `${t('platform.desktopNotifications.targetTypeStores', { defaultValue: "Filiallar bo'yicha" })}: ${count} ta (${t('platform.desktopNotifications.allAssociatedRegisters', { defaultValue: 'barcha kassalari' })})`;
    submitBtnLabel = t('platform.desktopNotifications.confirmSubmitSelected', {
      defaultValue: 'Ha, tanlanganlarga yuborish',
    });
  } else {
    modalTitle = targetCount != null
      ? t('platform.desktopNotifications.confirmModalTitle', { count: targetCount })
      : t('platform.desktopNotifications.confirmModalTitleAll', { defaultValue: 'Barcha kassalarga yuborilsinmi?' });

    targetLabel = targetCount != null
      ? `${t('platform.desktopNotifications.targetAll')} · ${targetCount} ta faol${
          p.onlineRegistersCount != null && p.onlineRegistersCount > 0
            ? ` (${t('platform.desktopNotifications.onlineShort', { defaultValue: 'onlayn' })}: ${p.onlineRegistersCount} ta)`
            : ''
        }`
      : t('platform.desktopNotifications.registersCountUnknown', { defaultValue: 'Barcha faol kassalar' });

    submitBtnLabel = targetCount != null
      ? t('platform.desktopNotifications.confirmSubmit', { count: targetCount })
      : t('platform.desktopNotifications.confirmSubmitAll', { defaultValue: 'Ha, barcha kassalarga yuborish' });
  }

  const modalNode = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-broadcast-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg sm:max-w-xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3.5">
          {isAlert && (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
              <AlertTriangle size={22} />
            </div>
          )}
          {isUpdate && (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
              <RefreshCw size={22} />
            </div>
          )}
          {!isAlert && !isUpdate && (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
              <Bell size={22} />
            </div>
          )}
          <div>
            <h3 id="confirm-broadcast-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {modalTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {p.scheduleType === 'SCHEDULED' && p.scheduledFormatted
                ? t('platform.desktopNotifications.confirmModalSubtitleScheduled', {
                    date: p.scheduledFormatted,
                    defaultValue: `Xabar ${p.scheduledFormatted} da avtomatik yuboriladi. Oflayn kassalar internetga ulanganda oladi.`,
                  })
                : t('platform.desktopNotifications.confirmModalSubtitle')}
            </p>
          </div>
        </div>

        <PlatformDesktopConfirmModalSummary
          t={t}
          targetLabel={targetLabel}
          isSelect={isSelect}
          isCompanies={p.targetType === 'COMPANIES'}
          selectedCompanies={p.selectedCompanies}
          selectedStores={p.selectedStores}
          isAlert={isAlert}
          isUpdate={isUpdate}
          visibleUntilFormatted={p.visibleUntilFormatted}
          scheduleType={p.scheduleType}
          scheduledFormatted={p.scheduledFormatted}
          activeTitle={activeTitle}
          activeBody={activeBody}
        />

        <div className="flex items-center justify-end gap-2 sm:gap-3 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={handleClose}
            className="whitespace-nowrap rounded-xl border border-slate-200 px-3.5 sm:px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer text-center shrink-0"
          >
            {t('platform.desktopNotifications.confirmCancel')}
          </button>
          <button
            type="button"
            onClick={p.executeBroadcast}
            disabled={p.sendPending}
            className="whitespace-nowrap inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-700 px-4 sm:px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 text-center shrink-0"
          >
            <Send size={15} className="shrink-0" />
            <span className="whitespace-nowrap">{submitBtnLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body
    ? createPortal(modalNode, document.body)
    : modalNode;
}
