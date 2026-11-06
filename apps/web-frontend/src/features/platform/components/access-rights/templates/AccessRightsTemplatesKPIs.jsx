import React from 'react';
import { Users, ShieldCheck, AlertCircle, Briefcase } from 'lucide-react';

export default function AccessRightsTemplatesKPIs({
  totalEmployees = 0,
  standardEmployees = 0,
  exceptionEmployees = 0,
  businessTypesCount = 0,
}) {
  const cards = [
    {
      title: 'Jami xodim',
      value: totalEmployees,
      icon: Users,
      color: 'text-slate-900 dark:text-slate-100',
      badge: 'Barcha tarmoq',
    },
    {
      title: 'Faqat shablon bo‘yicha ishlaydi',
      value: standardEmployees,
      icon: ShieldCheck,
      color: 'text-emerald-700 dark:text-emerald-400',
      badge: 'Standart huquq',
    },
    {
      title: 'Istisnosi bor xodim',
      value: exceptionEmployees,
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      badge: 'Alohida ruxsat/taqiq',
    },
    {
      title: 'Faoliyat turi',
      value: businessTypesCount,
      icon: Briefcase,
      color: 'text-slate-900 dark:text-slate-100',
      badge: 'Yo‘nalishlar',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{c.title}</span>
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-bold tracking-tight ${c.color}`}>
                {c.value}
              </span>
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                {c.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
