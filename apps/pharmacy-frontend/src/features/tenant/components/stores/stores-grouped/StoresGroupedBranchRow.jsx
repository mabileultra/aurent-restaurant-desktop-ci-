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
      className="ui-tr cursor-pointer group"
    >
      <td className="ui-td px-5 font-medium">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-canvas text-ink-muted flex items-center justify-center shrink-0 group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
            <TypeIcon size={13} strokeWidth={1.75} />
          </div>
          <span className="font-semibold text-ink truncate max-w-xs" title={store.name}>
            {store.name}
          </span>
        </div>
      </td>
      <td className="ui-td-nowrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
          {t(`productTemplates.businessTypes.${store.businessType ?? 'UNIVERSAL'}`, {
            defaultValue: store.businessType || 'Universal',
          })}
        </span>
      </td>
      <td className="ui-td">
        <StoresGroupedLocationCell
          store={store}
          regionName={regionName}
          districtName={districtName}
          empty={empty}
        />
      </td>
      <td className="ui-td-nowrap text-xs text-ink-muted">
        {store.phone ? (
          formatUzPhone(store.phone)
        ) : (
          <span className="text-ink-disabled font-medium">—</span>
        )}
      </td>
      <td className="ui-td-nowrap">
        <span className={store.active ? 'ui-badge-success' : 'ui-badge-neutral'}>
          <span className={`w-1.5 h-1.5 rounded-full ${store.active ? 'bg-success' : 'bg-ink-disabled'}`} />
          {store.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
        </span>
      </td>
      <td className="ui-td text-right" onClick={(e) => e.stopPropagation()}>
        <TableRowActionsMenu
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
