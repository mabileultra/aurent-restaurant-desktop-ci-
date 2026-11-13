import React from 'react';
import TableRowActionsMenu from '../../../../../components/shared/TableRowActionsMenu';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
} from '../../../../platform/utils/companyAvatarUtils';
import { formatUzPhone } from '../../../../../utils/phoneUz';
import { storeIsPharmacy } from '../../../utils/storeAslMarkingSupport';
import StoresGroupedLocationCell from './StoresGroupedLocationCell';

export default function StoresGroupedBranchRow({
  t,
  store,
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
  const branchMeta = getCompanyBranchMeta(store.businessType, t);
  const TypeIcon = branchMeta.icon;
  const badgeClass = getBusinessTypeBadgeClass();

  return (
    <tr
      onClick={() => onSelectStore?.(store)}
      className="border-b border-aa-line hover:bg-aa-surface-hover transition-colors cursor-pointer group"
    >
      <td className="px-5 py-3 font-medium text-aa-ink">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-aa-sm bg-aa-surface-sunken text-aa-ink-muted border border-aa-line flex items-center justify-center shrink-0 group-hover:text-aa-brand transition-colors">
            <TypeIcon size={13} />
          </div>
          <span className="font-semibold text-aa-ink truncate max-w-xs group-hover:text-aa-brand transition-colors" title={store.name}>
            {store.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-aa-line bg-aa-surface-sunken text-aa-ink-muted">
          {t(`productTemplates.businessTypes.${store.businessType ?? 'UNIVERSAL'}`, {
            defaultValue: store.businessType || 'Universal',
          })}
        </span>
      </td>
      <td className="px-4 py-3">
        <StoresGroupedLocationCell
          store={store}
          regionName={regionName}
          districtName={districtName}
          empty={empty}
        />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-aa-ink-muted whitespace-nowrap">
        {store.phone ? (
          formatUzPhone(store.phone)
        ) : (
          <span className="text-aa-ink-subtle font-medium font-sans">—</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            store.active
              ? 'border-transparent bg-aa-success-soft text-aa-success bg-emerald-50'
              : 'border-aa-line bg-aa-surface text-aa-ink-muted'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${store.active ? 'bg-aa-success bg-emerald-500' : 'bg-aa-ink-subtle'}`} />
          {store.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
        </span>
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <TableRowActionsMenu
          variant="aa"
          open={menuId === store.id}
          onOpenChange={(next) => onMenuOpenChange?.(next ? store.id : null)}
          actions={[
            { label: t('common.view', { defaultValue: 'Ko‘rish' }), onClick: () => onSelectStore?.(store) },
            { label: t('common.edit'), onClick: () => onEdit?.(store) },
            ...(storeIsPharmacy(store.businessType) && onPharmacyIntegration
              ? [{ label: t('stores.pharmacyIntegration.menu'), onClick: () => onPharmacyIntegration(store) }]
              : []),
            {
              label: store.active ? t('stores.deactivate') : t('stores.activate'),
              onClick: () => onToggleActive?.(store.id),
            },
            { label: t('common.delete'), danger: true, onClick: () => onDelete?.(store) },
          ]}
        />
      </td>
    </tr>
  );
}
