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
      className={`ui-card transition-all duration-200 overflow-hidden scroll-mt-24 ${
        isHighlighted
          ? 'border-primary-500 ring-2 ring-primary-500/40'
          : isExpanded
            ? 'border-line-strong'
            : 'hover:border-line-strong'
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
            ? 'bg-canvas border-b border-line'
            : 'hover:bg-primary-50/40'
        }`}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-control flex items-center justify-center font-bold ui-tabular text-sm shrink-0 border ${paletteClass}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-ink text-base truncate">
                {group.company.name}
              </h3>
              {group.company.businessType && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-ink-muted border border-line">
                  {t(`productTemplates.businessTypes.${group.company.businessType}`, {
                    defaultValue: group.company.businessType,
                  })}
                </span>
              )}
            </div>
            <div className="ui-tabular flex items-center gap-2 text-xs text-ink-muted mt-0.5">
              {group.company.tin && <span>STIR: {group.company.tin}</span>}
              {group.company.phone && <span>• {formatUzPhone(group.company.phone)}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
          <div className="flex items-center gap-1.5">
            <span className="ui-badge-neutral bg-surface">
              {t('platform.groupedBranchesCount', { count: group.total, defaultValue: `${group.total} ta filial` })}
            </span>
            <span className="ui-badge-success">
              {t('platform.groupedActiveCount', { count: group.active, defaultValue: `${group.active} faol` })}
            </span>
            {group.inactive > 0 && (
              <span className="ui-badge-warning">
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
              className="ui-btn ui-btn-secondary ui-btn-sm text-primary-700 border-primary-200 bg-primary-50 hover:bg-primary-100"
              title={t('platform.groupedAddBranch', { defaultValue: 'Filial qo‘shish' })}
            >
              <Plus size={14} strokeWidth={1.75} />
              <span className="hidden md:inline">{t('platform.groupedAddBranch', { defaultValue: 'Filial qo‘shish' })}</span>
            </button>
          )}
          <div className="p-1 rounded-lg text-ink-muted hover:text-ink transition-colors">
            {isExpanded ? <ChevronUp size={18} strokeWidth={1.75} /> : <ChevronDown size={18} strokeWidth={1.75} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-surface">
          {group.stores.length === 0 && loadingBranches ? (
            <div className="p-8 flex justify-center">
              <Spinner size="sm" text={t('common.loading')} />
            </div>
          ) : group.stores.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-muted">
              <p>{t('platform.groupedEmptyCompany', { defaultValue: 'Ushbu kompaniyada hozircha filiallar yo‘q' })}</p>
              {typeof group.id === 'number' && (
                <button
                  type="button"
                  onClick={() => openCreateForCompany?.(group.id)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                >
                  <Plus size={13} strokeWidth={1.75} />
                  <span>{t('platform.groupedAddBranch', { defaultValue: 'Birinchi filialni qo‘shish' })}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th className="ui-th px-5">{t('platform.colBranchName', { defaultValue: 'Filial nomi' })}</th>
                    <th className="ui-th">{t('platform.colBranchType', { defaultValue: 'Filial turi' })}</th>
                    <th className="ui-th">{t('stores.colAddress', { defaultValue: 'Manzil va joylashuv' })}</th>
                    <th className="ui-th">{t('stores.colPhone', { defaultValue: 'Telefon' })}</th>
                    <th className="ui-th">{t('stores.colActive', { defaultValue: 'Holat' })}</th>
                    <th className="ui-th w-12 text-right" />
                  </tr>
                </thead>
                <tbody>
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
