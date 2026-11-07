import React from 'react';
import { KeyRound, RotateCcw, Users, Layers, History, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AccessRightsHeader({
  activeTab = 'templates',
  onTabChange,
  exceptionsCount = 0,
  isLoading = false,
  onRefresh,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const tabs = [
    { id: 'templates', label: isRu ? 'Шаблоны ролей' : 'Rol shablonlari', icon: Layers },
    {
      id: 'staff',
      label: isRu ? 'Сотрудники и исключения' : 'Xodimlar va istisnolar',
      icon: Users,
      badge: exceptionsCount > 0 ? exceptionsCount : null,
    },
    { id: 'history', label: isRu ? 'Журнал изменений' : 'O‘zgarishlar tarixi', icon: History },
  ];

  const subtitles = {
    templates: isRu
      ? 'Для каждого направления бизнеса и роли задаётся шаблон. Индивидуальные права выдаются только как исключения.'
      : 'Har bir faoliyat turi va rol uchun shablon belgilanadi. Xodimga alohida huquq faqat shablondan istisno sifatida beriladi.',
    staff: isRu
      ? 'Сотрудники автоматически получают права из шаблона роли. Здесь настраиваются индивидуальные исключения.'
      : 'Xodim avtomatik ravishda o‘z rol shablonidan huquq oladi. Bu yerda faqat shablondan farq qiladigan istisnolar beriladi.',
    history: isRu
      ? 'Шаблоны, исключения, копирование и массовые действия — кто, когда и что изменил.'
      : 'Shablon, istisno, nusxa va ommaviy amallar — kim, qachon va nimani o‘zgartirgani.',
  };

  return (
    <header className="space-y-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>{isRu ? 'Управление' : 'Boshqaruv'}</span>
            <span>›</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {isRu ? 'Права доступа' : 'Kirish huquqlari'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
              <span>{isRu ? 'Права доступа' : 'Kirish huquqlari'}</span>
            </h1>
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Loader2 size={13} className="animate-spin text-emerald-600" />
                <span>{isRu ? 'Загрузка...' : 'Yuklanmoqda...'}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            {subtitles[activeTab] || subtitles.templates}
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <RotateCcw size={13} />
            <span>{isRu ? 'Обновить' : 'Yangilash'}</span>
          </button>
        )}
      </div>

      <nav className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 -mb-[17px] overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              ref={(el) => {
                if (isActive && el && typeof el.scrollIntoView === 'function') {
                  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
                }
              }}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'border-emerald-700 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span
                  title={tab.id === 'staff' ? (isRu ? `Всего исключений по сети: ${exceptionsCount}` : `Tarmoq bo‘yicha jami istisnolar: ${exceptionsCount}`) : undefined}
                  className={`text-xs font-bold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
