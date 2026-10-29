import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Copy,
  Trash2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru, uz } from 'date-fns/locale';

function resolveLocale(lang) {
  return lang?.startsWith('uz') ? uz : ru;
}

export default function PlatformDesktopNotificationDetailDrawer({ p }) {
  const { t, i18n } = p;
  const item = p.selectedItemForDrawer;
  const [drawerLang, setDrawerLang] = useState('uz');
  const [showAllUnreached, setShowAllUnreached] = useState(false);

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

  const formattedCreated = (() => {
    try {
      return format(new Date(item.createdAt), 'd-MMMM yyyy, HH:mm', {
        locale: resolveLocale(i18n.language),
      });
    } catch {
      return '—';
    }
  })();

  const formattedExpires = (() => {
    try {
      if (!item.expiresAt) return '31-oktabr, 18:10 gacha';
      return `${format(new Date(item.expiresAt), 'd-MMMM, HH:mm', {
        locale: resolveLocale(i18n.language),
      })} gacha`;
    } catch {
      return '31-oktabr, 18:10 gacha';
    }
  })();

  const delivered = item.deliveredCount ?? 231;
  const total = item.totalCount ?? 248;
  const read = item.readCount ?? 187;
  const readPercent = item.readPercent ?? 81;
  const offlineCount = Math.max(0, total - delivered) || 17;

  const progressPercent = Math.min(100, Math.round((delivered / total) * 100));

  const isAlert = item.kind === 'ALERT';
  const isUpdate = item.kind === 'UPDATE';

  // Demo offline cash registers list from mockup
  const unreachedList = [
    {
      company: 'Mobile Ultra',
      register: 'Mobile Ultra · Kassa 1',
      lastOnline: t('platform.desktopNotifications.lastOnline', { time: '2 kun oldin', defaultValue: 'oxirgi onlayn: 2 kun oldin' }),
    },
    {
      company: 'Raimbobo Market',
      register: 'Raimbobo Market · Kassa 2',
      lastOnline: t('platform.desktopNotifications.lastOnline', { time: '5 soat oldin', defaultValue: 'oxirgi onlayn: 5 soat oldin' }),
    },
    {
      company: 'Farina Invest',
      register: 'Farina Invest · Kassa 1',
      lastOnline: t('platform.desktopNotifications.lastOnline', { time: '1 soat oldin', defaultValue: 'oxirgi onlayn: 1 soat oldin' }),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[1000] flex justify-end bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-150"
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
                <span>{item.status === 'EXPIRED' ? t('platform.desktopNotifications.statusExpired') : t('platform.desktopNotifications.statusActive')}</span>
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
          {/* KPI Stats Cards */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {t('platform.desktopNotifications.statDelivered')}
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {delivered} <span className="text-xs font-normal text-slate-400">/ {total}</span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {t('platform.desktopNotifications.statRead')}
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {read} <span className="text-xs font-normal text-slate-400">· {readPercent}%</span>
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                  {t('platform.desktopNotifications.statOffline')}
                </p>
                <p className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-200 mt-1">
                  {offlineCount} <span className="text-xs font-normal text-amber-700/80 dark:text-amber-400">{t('platform.desktopNotifications.statOfflineSub')}</span>
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Language Tabs */}
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setDrawerLang('uz')}
              className={`pb-2.5 transition-colors border-b-2 font-bold ${
                drawerLang === 'uz'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              {t('platform.desktopNotifications.langUz')}
            </button>
            <button
              type="button"
              onClick={() => setDrawerLang('ru')}
              className={`flex items-center gap-1.5 pb-2.5 transition-colors border-b-2 ${
                drawerLang === 'ru'
                  ? 'border-emerald-600 font-bold text-emerald-700 dark:border-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <span>{t('platform.desktopNotifications.langRu')}</span>
              <span className="rounded px-1.5 py-0.2 text-[10px] font-semibold border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {t('platform.desktopNotifications.badgeEmpty')}
              </span>
            </button>
          </div>

          {/* Message Content Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {item.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {item.body}
            </p>
          </div>

          {/* Metadata Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500 dark:text-slate-400">
                {t('platform.desktopNotifications.confirmLabelTarget')}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {item.targetLabel || t('platform.desktopNotifications.targetAll')} · {total} ta
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
                  ? 'Kassir «Tushunarli»ni bosmaguncha ekranda turadi'
                  : 'Qo‘ng‘iroqcha bildirishnomalarida chiqadi'}
              </span>
            </div>
          </div>

          {/* Unreached Cash Registers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {t('platform.desktopNotifications.unreachedRegisters')}
              </h4>
              <button
                type="button"
                onClick={() => setShowAllUnreached((prev) => !prev)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
              >
                {showAllUnreached
                  ? t('platform.desktopNotifications.unreachedExpandedClose', { defaultValue: 'Qisqartirish' })
                  : t('platform.desktopNotifications.viewAllUnreached', { count: offlineCount })}
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden text-xs">
              {(showAllUnreached
                ? [
                    ...unreachedList,
                    {
                      company: 'Grand Asia Trade',
                      register: 'Grand Asia Trade · Kassa 1',
                      lastOnline: t('platform.desktopNotifications.lastOnline', { time: '3 soat oldin', defaultValue: 'oxirgi onlayn: 3 soat oldin' }),
                    },
                    {
                      company: 'Safia Bakery',
                      register: 'Safia Bakery · Kassa 2',
                      lastOnline: t('platform.desktopNotifications.lastOnline', { time: '4 soat oldin', defaultValue: 'oxirgi onlayn: 4 soat oldin' }),
                    },
                    {
                      company: 'Bek Baraka',
                      register: 'Bek Baraka · Kassa 1',
                      lastOnline: t('platform.desktopNotifications.lastOnline', { time: '1 kun oldin', defaultValue: 'oxirgi onlayn: 1 kun oldin' }),
                    },
                  ]
                : unreachedList
              ).map((reg, idx) => (
                <div key={idx} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{reg.company}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{reg.register}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {reg.lastOnline}
                  </span>
                </div>
              ))}
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
}
