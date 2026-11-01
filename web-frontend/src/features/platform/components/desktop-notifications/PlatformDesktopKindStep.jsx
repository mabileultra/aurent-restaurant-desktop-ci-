import React, { useRef } from 'react';
import { AlertTriangle, Check, MessageSquare, RefreshCw } from 'lucide-react';

export const KIND_OPTIONS = [
  {
    id: 'MESSAGE',
    icon: MessageSquare,
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    titleKey: 'platform.desktopNotifications.kindMessage',
    descKey: 'platform.desktopNotifications.kindMessageDesc',
  },
  {
    id: 'UPDATE',
    icon: RefreshCw,
    iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    titleKey: 'platform.desktopNotifications.kindUpdate',
    descKey: 'platform.desktopNotifications.kindUpdateDesc',
  },
  {
    id: 'ALERT',
    icon: AlertTriangle,
    iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    titleKey: 'platform.desktopNotifications.kindAlert',
    descKey: 'platform.desktopNotifications.kindAlertDesc',
  },
];

const KINDS = KIND_OPTIONS.map((k) => k.id);

export default function PlatformDesktopKindStep({ p }) {
  const { t } = p;
  const kindRefs = {
    MESSAGE: useRef(null),
    UPDATE: useRef(null),
    ALERT: useRef(null),
  };

  const handleKindKeyDown = (e, currentKind) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = KINDS.indexOf(currentKind);
      const nextIndex = (currentIndex + 1) % KINDS.length;
      const nextKind = KINDS[nextIndex];
      p.setKind(nextKind);
      kindRefs[nextKind]?.current?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = KINDS.indexOf(currentKind);
      const nextIndex = (currentIndex - 1 + KINDS.length) % KINDS.length;
      const nextKind = KINDS[nextIndex];
      p.setKind(nextKind);
      kindRefs[nextKind]?.current?.focus();
    }
  };

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          3
        </span>
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          {t('platform.desktopNotifications.stepKind')}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3" role="radiogroup" aria-label={t('platform.desktopNotifications.stepKind')}>
        {KIND_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = p.kind === item.id;
          return (
            <button
              key={item.id}
              ref={kindRefs[item.id]}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => p.setKind(item.id)}
              onKeyDown={(e) => handleKindKeyDown(e, item.id)}
              className={`relative flex flex-col justify-between p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                isSelected
                  ? 'border-emerald-600 bg-white ring-1 ring-emerald-600 shadow-xs dark:border-emerald-500 dark:bg-slate-850'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850'
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.iconBg}`}>
                  <Icon size={16} />
                </div>
                <div
                  className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t(item.titleKey)}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {t(item.descKey)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
