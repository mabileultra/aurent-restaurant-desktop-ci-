import React from 'react';
import { Search, AlertCircle } from 'lucide-react';
import PlatformSelect from '../../PlatformSelect';

export default function PlatformModuleAccessToolbar({
  searchTerm = '',
  setSearchTerm,
  accessFilter = 'all',
  setAccessFilter,
  unconfiguredCount = 0,
  isPlatformStaff = false,
  companies = [],
  companiesLoading = false,
  selectedCompanyId = '',
  setSelectedCompanyId,
  currentLang = 'uz',
  isTruncated = false,
  totalCount = 0,
  loadedCount = 0,
}) {
  const companyOptions = (companies || []).map((c) => ({
    value: String(c.id),
    label: c.name || c.brandName || String(c.id),
  }));

  const filterTabs = [
    { id: 'all', label: currentLang === 'ru' ? 'Все' : 'Hammasi' },
    {
      id: 'unconfigured',
      label: currentLang === 'ru' ? `Ненастроенные (${unconfiguredCount})` : `Sozlanmagan (${unconfiguredCount})`,
      isAmber: unconfiguredCount > 0,
    },
    { id: 'new', label: currentLang === 'ru' ? 'Новые' : 'Yangi' },
    { id: 'custom', label: currentLang === 'ru' ? 'С исключениями' : 'Istisnoli' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Qidiruv maydoni */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              currentLang === 'ru'
                ? 'Поиск по имени, логину или компании...'
                : 'Ism, login yoki kompaniya bo‘yicha qidiruv...'
            }
            aria-label="Foydalanuvchilarni qidirish"
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200"
          />
        </div>

        {/* Kompaniya tanlash (Platforma xodimlarida kerak emas) */}
        {!isPlatformStaff && (
          <div className="w-full md:w-64 shrink-0">
            <PlatformSelect
              options={companyOptions}
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              placeholder={currentLang === 'ru' ? 'Все компании' : 'Barcha kompaniyalar'}
              size="sm"
              searchable
              ariaLabel="Kompaniya bo‘yicha filtr"
              disabled={companiesLoading}
            />
          </div>
        )}
      </div>

      {/* Tezkor filtr tugmalari */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {filterTabs.map((f) => {
          const isActive = accessFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setAccessFilter(f.id)}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs dark:bg-white dark:text-slate-900'
                  : f.isAmber
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-800'
              }`}
            >
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chegara ogohlantirishi */}
      {isTruncated && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50/90 border border-amber-200/80 px-4 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
          <AlertCircle size={14} className="shrink-0 text-amber-600" />
          <span>
            {currentLang === 'ru'
              ? `Показаны первые ${loadedCount} из ${totalCount} сотрудников. Используйте поиск для точного выбора.`
              : `Dastlabki ${loadedCount} ta xodim ko‘rsatilmoqda (Jami: ${totalCount} ta). Aniq natija uchun qidiruvdan foydalaning.`}
          </span>
        </div>
      )}
    </div>
  );
}
