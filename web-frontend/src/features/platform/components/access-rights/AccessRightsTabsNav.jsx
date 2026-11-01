import React from 'react';
import { Layers, Users, History } from 'lucide-react';

export default function AccessRightsTabsNav({ activeTab, onTabChange, exceptionCount = 44 }) {
  const tabs = [
    { id: 'templates', label: 'Rol shablonlari', icon: Layers },
    { id: 'exceptions', label: 'Xodimlar va istisnolar', icon: Users, badge: exceptionCount },
    { id: 'history', label: 'O‘zgarishlar tarixi', icon: History },
  ];

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`group inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
