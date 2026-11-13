import React, { useEffect, useRef } from 'react';
import { RotateCcw, Users, Layers, History, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AaPageHeader from '../../../../components/aa/PageHeader';
import Button from '../../../../components/aa/Button';

export default function AccessRightsHeader({
  activeTab = 'templates',
  onTabChange,
  exceptionsCount = 0,
  isLoading = false,
  onRefresh,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const navRef = useRef(null);
  const activeTabRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    const activeEl = activeTabRef.current;
    if (!nav || !activeEl) return;

    if (nav.scrollWidth > nav.clientWidth) {
      const navRect = nav.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();

      if (tabRect.left < navRect.left) {
        nav.scrollLeft += tabRect.left - navRect.left - 16;
      } else if (tabRect.right > navRect.right) {
        nav.scrollLeft += tabRect.right - navRect.right + 16;
      }
    }
  }, [activeTab]);

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
    <header className="space-y-4 pb-2 border-b border-aa-line">
      <AaPageHeader
        breadcrumbs={[
          { label: isRu ? 'Управление' : 'Boshqaruv' },
          { label: isRu ? 'Права доступа' : 'Kirish huquqlari' },
        ]}
        title={isRu ? 'Права доступа' : 'Kirish huquqlari'}
        meta={(
          <div className="flex items-center gap-2">
            <span>{subtitles[activeTab] || subtitles.templates}</span>
            {isLoading && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-aa-full text-xs font-medium bg-aa-surface-sunken text-aa-ink-muted">
                <Loader2 size={12} className="animate-spin text-aa-brand" />
                <span>{isRu ? 'Загрузка...' : 'Yuklanmoqda...'}</span>
              </span>
            )}
          </div>
        )}
        actions={
          onRefresh ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={16} />}
              onClick={onRefresh}
            >
              {isRu ? 'Обновить' : 'Yangilash'}
            </Button>
          ) : null
        }
      />

      <nav
        ref={navRef}
        className="flex items-center gap-1 border-b border-aa-line -mb-[17px] overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              ref={isActive ? activeTabRef : null}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-aa-focus focus-visible:ring-offset-1 rounded-t-aa-md transition-all cursor-pointer ${
                isActive
                  ? 'border-aa-brand text-aa-brand'
                  : 'border-transparent text-aa-ink-muted hover:text-aa-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span
                  title={tab.id === 'staff' ? (isRu ? `Всего исключений по сети: ${exceptionsCount}` : `Tarmoq bo‘yicha jami istisnolar: ${exceptionsCount}`) : undefined}
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-aa-full ${
                    isActive
                      ? 'bg-aa-brand-soft text-aa-brand'
                      : 'bg-aa-surface-sunken text-aa-ink-muted'
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
