import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { formatUzbekDate } from './desktopNotificationFormatters';
import PlatformDesktopNotificationDrawerHeader from './PlatformDesktopNotificationDrawerHeader';
import PlatformDesktopNotificationDrawerFooter from './PlatformDesktopNotificationDrawerFooter';

export default function PlatformDesktopNotificationDetailDrawer({ p }) {
  const { t, i18n } = p;
  const item = p.selectedItemForDrawer;

  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  // Manage body scroll lock and focus trap
  useEffect(() => {
    if (!item) return;

    lastActiveElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (p.revokeConfirmItem) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
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
  }, [item]);

  if (!item) return null;

  const handleClose = () => {
    p.setSelectedItemForDrawer(null);
    setTimeout(() => {
      if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
        lastActiveElementRef.current.focus();
      }
    }, 50);
  };

  const formattedCreated = item.createdAt
    ? formatUzbekDate(item.createdAt, 'd-MMMM yyyy, HH:mm', i18n.language)
    : '—';

  const targetYear = item.expiresAt ? new Date(item.expiresAt).getFullYear() : null;
  const currentYear = new Date().getFullYear();
  const expiresPattern = targetYear && targetYear !== currentYear ? 'd-MMMM yyyy, HH:mm' : 'd-MMMM, HH:mm';
  const formattedExpires = item.expiresAt
    ? `${formatUzbekDate(item.expiresAt, expiresPattern, i18n.language)} gacha`
    : '—';


  const drawerNode = (
    <div
      className="fixed inset-0 z-[99999] flex justify-end bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-notif-drawer-title"
    >
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-slate-200 dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-right duration-200"
      >
        <PlatformDesktopNotificationDrawerHeader
          item={item}
          formattedCreated={formattedCreated}
          closeBtnRef={closeBtnRef}
          onClose={handleClose}
          t={t}
        />

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Honest Untracked Notice (replaces fake mockup statistics) */}
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-300">
            <Info size={18} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                {t('platform.desktopNotifications.colDelivered')}: {t('platform.desktopNotifications.untracked', { defaultValue: 'Kuzatilmagan' })}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('platform.desktopNotifications.detailUntrackedHint', {
                  defaultValue: "Kassir xabarni o'qigani hozircha kuzatilmaydi (Server barcha faol kassalarga tarqatadi).",
                })}
              </p>
            </div>
          </div>

          {/* Message Content Box */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('platform.desktopNotifications.stepContent', { defaultValue: 'Xabar matni' })}
            </h4>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {item.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {item.body}
              </p>
            </div>
          </div>

          {/* Metadata Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500 dark:text-slate-400">
                {t('platform.desktopNotifications.confirmLabelTarget')}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {item.targetLabel || t('platform.desktopNotifications.targetAll')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500 dark:text-slate-400">
                {t('platform.desktopNotifications.confirmLabelExpires')}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formattedExpires}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500 dark:text-slate-400">Kassada</span>
              <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[260px]">
                {item.kind === 'ALERT'
                  ? 'Kassir yopmaguncha ekranda turadi'
                  : 'Qo‘ng‘iroqcha bildirishnomalarida chiqadi'}
              </span>
            </div>
          </div>
        </div>

        <PlatformDesktopNotificationDrawerFooter item={item} p={p} t={t} />
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(drawerNode, document.body);
  }
  return drawerNode;
}
