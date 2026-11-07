import React, { useEffect, useRef } from 'react';
import { FileText, History, Send, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EMAIL_TAB_KEYS } from '../../utils/emailConstants';

export default function PlatformEmailTabsNav({ activeTab, onSelectTab }) {
  const { t } = useTranslation();
  const navRef = useRef(null);
  const activeTabRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    const tab = activeTabRef.current;
    if (!nav || !tab) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    if (tabRect.left < navRect.left) {
      nav.scrollLeft += tabRect.left - navRect.left - 12;
    } else if (tabRect.right > navRect.right) {
      nav.scrollLeft += tabRect.right - navRect.right + 12;
    }
  }, [activeTab]);

  const tabs = [
    { id: EMAIL_TAB_KEYS.SEND, label: t('platform.email.tabSend', 'Yuborish'), icon: Send },
    { id: EMAIL_TAB_KEYS.HISTORY, label: t('platform.email.tabHistory', 'Tarix'), icon: History },
    { id: EMAIL_TAB_KEYS.TEMPLATES, label: t('platform.email.tabTemplates', 'Avtomatik xatlar'), icon: FileText },
    { id: EMAIL_TAB_KEYS.SETTINGS, label: t('platform.email.tabSettings', 'Sozlamalar'), icon: Sliders },
  ];

  return (
    <div className="relative w-full">
      <nav
        ref={navRef}
        aria-label="Pochta bo‘limlari"
        className="flex gap-1 border-b border-slate-200 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden dark:border-slate-800"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
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
            </button>
          );
        })}
      </nav>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent sm:hidden"
      />
    </div>
  );
}
