import React from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Spinner } from '../../../../../components/ui';
import { getCompanyInitials, getCompanyPalette } from '../../../../platform/utils/companyAvatarUtils';
import { formatUzPhone } from '../../../../../utils/phoneUz';
import StoresGroupedBranchRow from './StoresGroupedBranchRow';

export default function StoresGroupedCompanyCard({
  t,
  group,
  isExpanded,
  isHighlighted,
  loadingBranches,
  onToggle,
  openCreateForCompany,
  menuId,
  onMenuOpenChange,
  onEdit,
  onToggleActive,
  onDelete,
  onPharmacyIntegration,
  onSelectStore,
  regionName,
  districtName,
  empty,
}) {
  const initials = getCompanyInitials(group.company.name);
  const paletteClass = getCompanyPalette(group.company.name, group.company.id);

  return (
    <div
      id={`company-group-${group.id}`}
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xs scroll-mt-24 ${
        isHighlighted
          ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/50 shadow-md bg-white dark:bg-slate-900'
          : isExpanded
            ? 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900 ring-1 ring-slate-900/5'
            : 'border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggle(group.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(group.id);
          }
        }}
        className={`w-full p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left cursor-pointer select-none transition-colors ${
          isExpanded
            ? 'bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800'
            : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/50'
        }`}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold font-mono text-sm shadow-2xs shrink-0 border ${paletteClass}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                {group.company.name}
              </h3>
              {group.company.businessType && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {t(`productTemplates.businessTypes.${group.company.businessType}`, {
                    defaultValue: group.company.businessType,
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {group.company.tin && <span className="font-mono">STIR: {group.company.tin}</span>}
              {group.company.phone && <span>• {formatUzPhone(group.company.phone)}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
              {t('platform.groupedBranchesCount', { count: group.total, defaultValue: `${group.total} ta filial` })}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              {t('platform.groupedActiveCount', { count: group.active, defaultValue: `${group.active} faol` })}
            </span>
            {group.inactive > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                {t('platform.groupedInactiveCount', { count: group.inactive, defaultValue: `${group.inactive} nofaol` })}
              </span>
            )}
          </div>
          {typeof group.id === 'number' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCreateForCompany?.(group.id);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
              title={t('platform.groupedAddBranch', { defaultValue: 'Filial qo‘shish' })}
            >
              <Plus size={14} />
              <span className="hidden md:inline">{t('platform.groupedAddBranch', { defaultValue: 'Filial qo‘shish' })}</span>
            </button>
          )}
          <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white dark:bg-slate-900">
          {group.stores.length === 0 && loadingBranches ? (
            <div className="p-8 flex justify-center">
              <Spinner size="sm" text={t('common.loading')} />
            </div>
          ) : group.stores.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              <p>{t('platform.groupedEmptyCompany', { defaultValue: 'Ushbu kompaniyada hozircha filiallar yo‘q' })}</p>
              {typeof group.id === 'number' && (
                <button
                  type="button"
                  onClick={() => openCreateForCompany?.(group.id)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Plus size={13} />
                  <span>{t('platform.groupedAddBranch', { defaultValue: 'Birinchi filialni qo‘shish' })}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/90 text-left text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-850/40">
                    <th className="px-5 py-2.5 font-medium">{t('platform.colBranchName', { defaultValue: 'Filial nomi' })}</th>
                    <th className="px-4 py-2.5 font-medium">{t('platform.colBranchType', { defaultValue: 'Filial turi' })}</th>
                    <th className="px-4 py-2.5 font-medium">{t('stores.colAddress', { defaultValue: 'Manzil va joylashuv' })}</th>
                    <th className="px-4 py-2.5 font-medium">{t('stores.colPhone', { defaultValue: 'Telefon' })}</th>
                    <th className="px-4 py-2.5 font-medium">{t('stores.colActive', { defaultValue: 'Holat' })}</th>
                    <th className="px-4 py-2.5 w-12 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {group.stores.map((store) => (
                    <StoresGroupedBranchRow
                      key={store.id}
                      t={t}
                      store={store}
                      menuId={menuId}
                      onMenuOpenChange={onMenuOpenChange}
                      onEdit={onEdit}
                      onToggleActive={onToggleActive}
                      onDelete={onDelete}
                      onPharmacyIntegration={onPharmacyIntegration}
                      onSelectStore={onSelectStore}
                      regionName={regionName}
                      districtName={districtName}
                      empty={empty}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
