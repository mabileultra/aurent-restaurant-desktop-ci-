import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Copy,
  Info,
  Trash2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru, uz } from 'date-fns/locale';

function resolveLocale(lang) {
  return lang?.startsWith('uz') ? uz : ru;
}

function formatUzbekDate(iso, pattern, lang) {
  try {
    const d = new Date(iso);
    const res = format(d, pattern, { locale: resolveLocale(lang) });
    return lang?.startsWith('uz')
      ? res.replace(/-([A-ZА-ЯЁ][a-zа-яё]+)/g, (m, p1) => `-${p1.toLowerCase()}`)
      : res;
  } catch {
    return '—';
  }
}

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

  const formattedExpires = item.expiresAt
    ? `${formatUzbekDate(item.expiresAt, 'd-MMMM, HH:mm', i18n.language)} gacha`
    : '—';

  const isAlert = item.kind === 'ALERT';
  const isUpdate = item.kind === 'UPDATE';

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
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAlert && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                  {t('platform.desktopNotifications.kindAlert')}
                </span>
              )}
              {isUpdate && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                  {t('platform.desktopNotifications.kindUpdate')}
                </span>
              )}
              {!isAlert && !isUpdate && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  {t('platform.desktopNotifications.kindMessage')}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>
                  {item.status === 'EXPIRED'
                    ? t('platform.desktopNotifications.statusExpired')
                    : t('platform.desktopNotifications.statusActive')}
                </span>
              </span>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={handleClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label={t('common.close', { defaultValue: 'Yopish' })}
            >
              <X size={20} />
            </button>
          </div>

          <h2
            id="desktop-notif-drawer-title"
            className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-3"
          >
            {item.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('platform.desktopNotifications.drawerSentBy', { date: formattedCreated })}
          </p>
        </div>

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
                  defaultValue: "Kassalarda hisoblagich kuzatilmagan (Server barcha faol kassalarga tarqatadi, alohida o'qish kvitansiyalari yuritilmaydi).",
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
                {isAlert
                  ? 'Kassir yopmaguncha ekranda turadi'
                  : 'Qo‘ng‘iroqcha bildirishnomalarida chiqadi'}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => p.handleDuplicate(item)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            >
              <Copy size={15} />
              <span>{t('platform.desktopNotifications.actionDuplicate')}</span>
            </button>
            <button
              type="button"
              onClick={() => p.handleExtend(item)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            >
              <Clock size={15} />
              <span>{t('platform.desktopNotifications.actionExtend')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => p.handleRevoke(item)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
            <span>{t('platform.desktopNotifications.actionRevoke')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(drawerNode, document.body);
  }
  return drawerNode;
}
