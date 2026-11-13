import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { BaseCheckbox } from '../../../../components/ui';

/**
 * UsersTableHeader
 * Accessible table header with sortable columns and bulk selection checkbox.
 */
export default function UsersTableHeader({
  t,
  isPlatform,
  allSelected,
  someSelected,
  onToggleSelectAll,
  sortField,
  sortDirection,
  onSort,
}) {
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="text-aa-ink-subtle group-hover:text-aa-ink" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={13} className="text-aa-ink" />
    ) : (
      <ArrowDown size={13} className="text-aa-ink" />
    );
  };

  const getSortAria = (field) => {
    if (sortField !== field) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  const handleKeySort = (e, field) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort?.(field);
    }
  };

  return (
    <thead>
      <tr className="border-b border-aa-line bg-aa-surface-sunken text-xs font-semibold text-aa-ink-muted sticky top-0 z-10">
        {/* Checkbox select */}
        <th className="w-12 px-3 py-3.5 text-center">
          <BaseCheckbox
            variant="aa"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = someSelected;
            }}
            onChange={(e) => onToggleSelectAll?.(e.target.checked)}
            aria-label={t('common.selectAll', { defaultValue: 'Barchasini tanlash' })}
            size={18}
          />
        </th>

        {/* User details */}
        <th
          role="columnheader"
          tabIndex={0}
          aria-sort={getSortAria('fullName')}
          onClick={() => onSort?.('fullName')}
          onKeyDown={(e) => handleKeySort(e, 'fullName')}
          className="w-[34%] min-w-[220px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-aa-surface-hover"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <span>{t('users.colUser')}</span>
            {renderSortIcon('fullName')}
          </div>
        </th>

        {/* Role */}
        <th
          role="columnheader"
          tabIndex={0}
          aria-sort={getSortAria('role')}
          onClick={() => onSort?.('role')}
          onKeyDown={(e) => handleKeySort(e, 'role')}
          className="w-[18%] min-w-[120px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-aa-surface-hover"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <span>{t('users.colRole')}</span>
            {renderSortIcon('role')}
          </div>
        </th>

        {/* Company / Store */}
        <th
          role="columnheader"
          tabIndex={0}
          aria-sort={getSortAria('company')}
          onClick={() => onSort?.('company')}
          onKeyDown={(e) => handleKeySort(e, 'company')}
          className="w-[32%] min-w-[200px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-aa-surface-hover"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <span>{isPlatform ? t('users.colCompany') : t('users.colStores', { defaultValue: 'Filiallar' })}</span>
            {renderSortIcon('company')}
          </div>
        </th>

        {/* Status (labeled HOLAT instead of FAOL) */}
        <th
          role="columnheader"
          tabIndex={0}
          aria-sort={getSortAria('status')}
          onClick={() => onSort?.('status')}
          onKeyDown={(e) => handleKeySort(e, 'status')}
          className="w-[16%] min-w-[100px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-aa-surface-hover"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <span>{t('platform.colStatus', { defaultValue: 'Holat' })}</span>
            {renderSortIcon('status')}
          </div>
        </th>

        {/* Actions */}
        <th className="admin-table-sticky-end w-12 px-3 py-3.5 text-right" />
      </tr>
    </thead>
  );
}
