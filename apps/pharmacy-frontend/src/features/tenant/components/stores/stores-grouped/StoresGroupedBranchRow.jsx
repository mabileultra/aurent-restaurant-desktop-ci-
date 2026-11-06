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
      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
    >
      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/60 dark:group-hover:text-emerald-300 transition-colors">
            <TypeIcon size={13} />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs" title={store.name}>
            {store.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeClass}`}>
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
      <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
        {store.phone ? (
          formatUzPhone(store.phone)
        ) : (
          <span className="text-slate-400 dark:text-slate-600 font-medium font-sans">—</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            store.active
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${store.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {store.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
        </span>
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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
