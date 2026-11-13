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
      className={`rounded-aa-lg border transition-all duration-200 overflow-hidden shadow-none scroll-mt-24 ${
        isHighlighted
          ? 'border-aa-brand ring-2 ring-aa-brand/50 ring-emerald-500 bg-aa-surface'
          : isExpanded
            ? 'border-aa-line-strong bg-aa-surface'
            : 'border-aa-line bg-aa-surface hover:border-aa-line-strong'
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
            ? 'bg-aa-surface-sunken border-b border-aa-line'
            : 'hover:bg-aa-surface-hover'
        }`}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-aa-md flex items-center justify-center font-bold font-mono text-sm shrink-0 border border-aa-line bg-aa-surface-sunken text-aa-ink">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-aa-ink text-base truncate">
                {group.company.name}
              </h3>
              {group.company.businessType && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-aa-surface-sunken text-aa-ink-muted border border-aa-line">
                  {t(`productTemplates.businessTypes.${group.company.businessType}`, {
                    defaultValue: group.company.businessType,
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-aa-ink-muted mt-0.5">
              {group.company.tin && <span className="font-mono">STIR: {group.company.tin}</span>}
              {group.company.phone && <span>• {formatUzPhone(group.company.phone)}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-aa-line">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aa-surface-sunken text-aa-ink-muted border border-aa-line">
              {t('platform.groupedBranchesCount', { count: group.total, defaultValue: `${group.total} ta filial` })}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-aa-success-soft text-aa-success border border-transparent">
              {t('platform.groupedActiveCount', { count: group.active, defaultValue: `${group.active} faol` })}
            </span>
            {group.inactive > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-aa-warning-soft text-aa-warning border border-transparent">
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
              className="aa-btn aa-btn--secondary aa-size-sm inline-flex items-center gap-1 font-semibold cursor-pointer"
              title={t('platform.groupedAddBranch', { defaultValue: 'Filial qo‘shish' })}
            >
              <Plus size={16} />
              <span className="hidden md:inline">{t('platform.groupedAddBranch', { defaultValue: 'Filial qo‘shish' })}</span>
            </button>
          )}
          <div className="p-1 rounded-aa-md text-aa-ink-muted hover:text-aa-ink transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-aa-surface">
          {group.stores.length === 0 && loadingBranches ? (
            <div className="p-8 flex justify-center">
              <Spinner size="sm" text={t('common.loading')} />
            </div>
          ) : group.stores.length === 0 ? (
            <div className="p-6 text-center text-sm text-aa-ink-muted">
              <p>{t('platform.groupedEmptyCompany', { defaultValue: 'Ushbu kompaniyada hozircha filiallar yo‘q' })}</p>
              {typeof group.id === 'number' && (
                <button
                  type="button"
                  onClick={() => openCreateForCompany?.(group.id)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-aa-brand hover:underline cursor-pointer"
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
                  <tr className="border-b border-aa-line text-left text-[12px] font-semibold text-aa-ink-muted bg-aa-surface-sunken h-[52px]">
                    <th className="px-5 py-2.5 font-semibold">{t('platform.colBranchName', { defaultValue: 'Filial nomi' })}</th>
                    <th className="px-4 py-2.5 font-semibold">{t('platform.colBranchType', { defaultValue: 'Filial turi' })}</th>
                    <th className="px-4 py-2.5 font-semibold">{t('stores.colAddress', { defaultValue: 'Manzil va joylashuv' })}</th>
                    <th className="px-4 py-2.5 font-semibold">{t('stores.colPhone', { defaultValue: 'Telefon' })}</th>
                    <th className="px-4 py-2.5 font-semibold">{t('stores.colActive', { defaultValue: 'Holat' })}</th>
                    <th className="px-4 py-2.5 w-12 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-aa-line">
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
