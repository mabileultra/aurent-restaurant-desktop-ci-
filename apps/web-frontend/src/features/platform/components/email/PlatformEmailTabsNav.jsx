import React from 'react';
import { FileText, History, Send, Sliders } from 'lucide-react';
import { EMAIL_TAB_KEYS } from '../../utils/emailConstants';

export default function PlatformEmailTabsNav({ activeTab, onSelectTab }) {
  const tabs = [
    { id: EMAIL_TAB_KEYS.SEND, label: 'Yuborish', icon: Send },
    { id: EMAIL_TAB_KEYS.HISTORY, label: 'Tarix', icon: History },
    { id: EMAIL_TAB_KEYS.TEMPLATES, label: 'Avtomatik xatlar', icon: FileText, badge: '3' },
    { id: EMAIL_TAB_KEYS.SETTINGS, label: 'Sozlamalar', icon: Sliders },
  ];

  return (
    <div className="relative w-full">
      <nav
        aria-label="Pochta bo‘limlari"
        className="flex gap-1 border-b border-slate-200 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden dark:border-slate-800"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-semibold transition -mb-px shrink-0 ${
                isActive
                  ? 'border-emerald-700 text-emerald-800 dark:border-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      {/* Mobile scroll indicator gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent sm:hidden"
      />
    </div>
  );
}
