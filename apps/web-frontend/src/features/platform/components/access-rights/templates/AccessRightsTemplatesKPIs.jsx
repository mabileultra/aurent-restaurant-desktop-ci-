import React from 'react';
import { Users, ShieldCheck, AlertCircle, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AccessRightsTemplatesKPIs({
  totalEmployees = 0,
  standardEmployees = 0,
  exceptionEmployees = 0,
  rolesCount = 0,
  scopeLabel = '',
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const scope = scopeLabel || (isRu ? 'Выбранный тип' : 'Tanlangan tur');

  const cards = [
    {
      title: isRu ? 'Сотрудники типа' : 'Tur xodimlari',
      value: totalEmployees,
      icon: Users,
      color: 'text-slate-900 dark:text-slate-100',
      badge: scope,
    },
    {
      title: isRu ? 'Только по шаблону' : 'Faqat shablon bo‘yicha',
      value: standardEmployees,
      icon: ShieldCheck,
      color: 'text-emerald-700 dark:text-emerald-400',
      badge: isRu ? 'Стандарт' : 'Standart',
    },
    {
      title: isRu ? 'С исключениями' : 'Istisnosi bor',
      value: exceptionEmployees,
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      badge: isRu ? 'Персональные' : 'Istisno',
    },
    {
      title: isRu ? 'Ролей в типе' : 'Tur rollari',
      value: rolesCount,
      icon: Briefcase,
      color: 'text-slate-900 dark:text-slate-100',
      badge: scope,
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
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[50%] text-right">
                {c.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
