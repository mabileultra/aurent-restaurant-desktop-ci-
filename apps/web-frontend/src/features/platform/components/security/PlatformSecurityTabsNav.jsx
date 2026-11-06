import React from 'react';
import { LayoutDashboard, Radio, History, Users, Sliders } from 'lucide-react';
import { SECURITY_TAB_KEYS, SECURITY_TABS } from '../../utils/securityConstants';

const TAB_ICONS = {
  [SECURITY_TAB_KEYS.OVERVIEW]: LayoutDashboard,
  [SECURITY_TAB_KEYS.SESSIONS]: Radio,
  [SECURITY_TAB_KEYS.AUDIT]: History,
  [SECURITY_TAB_KEYS.STAFF]: Users,
  [SECURITY_TAB_KEYS.RULES]: Sliders,
};

export default function PlatformSecurityTabsNav({ activeTab, onSelectTab, staffCount = 3 }) {
  return (
    <nav
      className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 -mb-px"
      aria-label="Xavfsizlik bo'limlari"
    >
      {SECURITY_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = TAB_ICONS[tab.id] || LayoutDashboard;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isActive
                ? 'border-emerald-700 text-emerald-800 dark:border-emerald-500 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <IconComponent className={`w-4 h-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
            {tab.showCount && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-xs ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {staffCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
