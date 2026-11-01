import React from 'react';
import { Users, ShieldCheck, AlertCircle, Briefcase } from 'lucide-react';

export default function AccessRightsKpiCards({ stats }) {
  const cards = [
    {
      title: 'Jami xodim',
      value: stats?.totalEmployees ?? 338,
      icon: Users,
      color: 'text-slate-900 dark:text-white',
      badge: 'Barcha faol',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      title: 'Faqat shablon bo‘yicha ishlaydi',
      value: stats?.templateOnlyCount ?? 294,
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      badge: `${Math.round(((stats?.templateOnlyCount ?? 294) / (stats?.totalEmployees ?? 338)) * 100)}%`,
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      title: 'Istisnosi bor xodim',
      value: stats?.exceptionCount ?? 44,
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      badge: 'Maxsus ruxsatlar',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      title: 'Faoliyat turi',
      value: stats?.businessTypesCount ?? 9,
      icon: Briefcase,
      color: 'text-indigo-600 dark:text-indigo-400',
      badge: 'Shablonlar bazasi',
      badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {c.value}
              </span>
              <Icon size={18} className="text-slate-400 dark:text-slate-500" />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {c.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
