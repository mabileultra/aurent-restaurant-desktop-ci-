import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Download,
  KeyRound,
  RotateCcw,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../../components/shared/TablePagination';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import { USER_ROLE_BADGE } from '../../constants';
import { canDeleteUser } from '../../utils/userDeletePolicy';

function formatSimpleDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function UsersTable({
  t,
  isPlatform,
  isLoading,
  pageRows = [],
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  menuId,
  onMenuOpenChange,
  onEdit,
  onToggleActive,
  onDelete,
  actorRole,
  companyById,
  onRowClick,
  sortField = 'fullName',
  sortDirection = 'asc',
  onSort,
  selectedUserIds = new Set(),
  onToggleSelectAll,
  onToggleSelectUser,
  onClearSelection,
  onBulkToggleActive,
  onExportSelectedCsv,
}) {
  const colSpan = isPlatform ? 7 : 6;
  const regionCodes = pageRows
    .map((u) => u.regionCode || companyById?.get?.(String(u.companyId ?? ''))?.regionCode)
    .filter(Boolean);
  const { regionName, districtName } = useGeoNameLookup(regionCodes);

  const businessTypeLabel = (user) => {
    const company = companyById?.get?.(String(user.companyId ?? ''));
    const code = String(company?.businessType || 'UNIVERSAL').toUpperCase();
    const normalized = code === 'RETAIL' ? 'UNIVERSAL' : code;
    return t(`productTemplates.businessTypes.${normalized}`, normalized);
  };

  const allSelected = pageRows.length > 0 && pageRows.every((u) => selectedUserIds.has(String(u.id)));
  const someSelected = pageRows.some((u) => selectedUserIds.has(String(u.id))) && !allSelected;

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={13} className="text-purple-600 dark:text-purple-400" />
    ) : (
      <ArrowDown size={13} className="text-purple-600 dark:text-purple-400" />
    );
  };

  const getSortAria = (field) => {
    if (sortField !== field) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="relative">
      <div className="admin-table-shell overflow-hidden rounded-2xl bg-white shadow-2xs dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 backdrop-blur-xs text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400 sticky top-0 z-10">
                
                {/* Checkbox select */}
                <th className="w-12 px-3 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onToggleSelectAll?.(e.target.checked)}
                    aria-label={t('common.selectAll', { defaultValue: 'Barchasini tanlash' })}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-700"
                  />
                </th>

                {/* User details: Full Name, username · phone */}
                <th
                  role="columnheader"
                  tabIndex={0}
                  aria-sort={getSortAria('fullName')}
                  onClick={() => onSort?.('fullName')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSort?.('fullName');
                    }
                  }}
                  className="w-[30%] min-w-[240px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSort?.('role');
                    }
                  }}
                  className="w-[14%] min-w-[110px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSort?.('company');
                    }
                  }}
                  className="w-[24%] min-w-[180px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>{isPlatform ? t('users.colCompany') : t('users.colStores', { defaultValue: 'Filiallar' })}</span>
                    {renderSortIcon('company')}
                  </div>
                </th>

                {/* Status */}
                <th
                  role="columnheader"
                  tabIndex={0}
                  aria-sort={getSortAria('status')}
                  onClick={() => onSort?.('status')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSort?.('status');
                    }
                  }}
                  className="w-[12%] min-w-[90px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>{t('users.colActive')}</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                {/* Created At */}
                <th
                  role="columnheader"
                  tabIndex={0}
                  aria-sort={getSortAria('createdAt')}
                  onClick={() => onSort?.('createdAt')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSort?.('createdAt');
                    }
                  }}
                  className="w-[14%] min-w-[120px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>{t('users.createdAt', { defaultValue: 'Yaratilgan sana' })}</span>
                    {renderSortIcon('createdAt')}
                  </div>
                </th>

                {/* Actions */}
                <th className="admin-table-sticky-end w-12 px-3 py-3.5 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span>{t('common.loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {t('platform.noSearchResults')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t('users.emptyFilterHint', { defaultValue: 'Qidiruv so\'rovi yoki filtrlarni o\'zgartirib ko\'ring' })}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((user) => {
                  const company = companyById?.get?.(String(user.companyId ?? ''));
                  const loginCode = user.companyLoginCode || company?.loginCode;
                  const isSelected = selectedUserIds.has(String(user.id));
                  const formattedDate = formatSimpleDate(user.createdAt);

                  const displayName = user.fullName && user.fullName.replace(/[-—\s]/g, '').length > 0
                    ? user.fullName
                    : user.username;

                  const isPin = user.role === 'CASHIER' || user.role === 'COOK' || user.role === 'WAITER';
                  const securityTooltip = isPin
                    ? (user.role === 'COOK' ? 'Oshpaz PIN-kodi' : user.role === 'WAITER' ? 'Ofitsiant PIN-kodi' : t('users.credentialsPinHidden', { defaultValue: 'PIN yashirilgan' }))
                    : t('users.credentialsPasswordHidden', { defaultValue: 'Parol yashirilgan' });

                  return (
                    <tr
                      key={user.id}
                      tabIndex={0}
                      onClick={() => onRowClick?.(user)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onRowClick?.(user);
                        }
                      }}
                      className={`group cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectUser?.(user.id)}
                          aria-label={t('users.selectUser', { name: displayName, defaultValue: 'Foydalanuvchini tanlash' })}
                          className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>

                      {/* Foydalanuvchi (Ism, username · phone) */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {displayName}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                              {user.username}
                            </span>
                            {user.phone ? (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                  {user.phone}
                                </span>
                              </>
                            ) : user.email ? (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                                  {user.email}
                                </span>
                              </>
                            ) : null}
                          </div>
                          {/* Compact security credential badge with title */}
                          <div
                            className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500"
                            title={securityTooltip}
                          >
                            <KeyRound size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{securityTooltip}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            USER_ROLE_BADGE[user.role] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {t(`roles.${user.role}`, user.role)}
                        </span>
                      </td>

                      {/* Kompaniya / filial */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col min-w-0">
                          {isPlatform && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-slate-900 dark:text-white truncate">
                                {user.companyName || company?.name || '—'}
                              </span>
                              {loginCode ? (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-700"
                                  title={`${t('users.companyLoginCode', { defaultValue: 'Kompaniya kodi' })}: #${loginCode}`}
                                >
                                  #{loginCode}
                                </span>
                              ) : null}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {user.storeNames?.length ? (
                              <span className="truncate" title={user.storeNames.join(', ')}>
                                {user.storeNames.join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-400">Filialsiz</span>
                            )}
                            {isPlatform && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                  {businessTypeLabel(user)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Holat (Active / Inactive badge) */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
                        </span>
                      </td>

                      {/* Yaratilgan sana */}
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        <span>{formattedDate}</span>
                      </td>

                      {/* Sticky Actions Menu */}
                      <td
                        className="admin-table-sticky-end px-3 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TableRowActionsMenu
                          open={menuId === user.id}
                          onOpenChange={(next) => onMenuOpenChange(next ? user.id : null)}
                          actions={[
                            {
                              label: t('common.edit'),
                              onClick: () => onEdit(user),
                            },
                            {
                              label: user.active ? t('users.deactivate') : t('users.activate'),
                              onClick: () => onToggleActive(user.id),
                            },
                            {
                              label: t('users.resetPasswordOrPin', { defaultValue: 'Parol / PIN tiklash' }),
                              onClick: () => onEdit(user),
                            },
                            {
                              label: t('users.copyUuid', { defaultValue: 'ID nusxalash' }),
                              onClick: () => {
                                if (user.id) {
                                  navigator.clipboard.writeText(String(user.id));
                                  toast.success(t('users.uuidCopied', { defaultValue: 'Foydalanuvchi ID nusxalandi' }));
                                }
                              },
                            },
                            {
                              label: t('users.terminateSessions', { defaultValue: 'Sessiyalarni tugatish' }),
                              onClick: () => {
                                toast.success(t('users.sessionsTerminated', { defaultValue: 'Sessiyalar tugatildi' }));
                              },
                            },
                            {
                              label: t('common.delete'),
                              onClick: () => onDelete(user),
                              danger: true,
                              disabled: !canDeleteUser(actorRole, user.role),
                              disabledReason: !canDeleteUser(actorRole, user.role)
                                ? t('users.deleteRestricted', { defaultValue: 'Ushbu rolni o‘chirish huquqi mavjud emas' })
                                : undefined,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>

      {/* Bulk Actions Floating Bar */}
      {selectedUserIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>
              {t('users.selectedCount', { count: selectedUserIds.size, defaultValue: `${selectedUserIds.size} ta tanlandi` })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onBulkToggleActive?.(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-xs font-medium transition-colors"
          >
            <UserCheck size={14} />
            <span>{t('users.activate', { defaultValue: 'Faollashtirish' })}</span>
          </button>

          <button
            type="button"
            onClick={() => onBulkToggleActive?.(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-xs font-medium transition-colors"
          >
            <UserX size={14} />
            <span>{t('users.deactivate', { defaultValue: 'Faolsizlantirish' })}</span>
          </button>

          <button
            type="button"
            onClick={onExportSelectedCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-xs font-medium transition-colors"
          >
            <Download size={14} />
            <span>{t('common.exportCsv', { defaultValue: 'Eksport (CSV)' })}</span>
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            aria-label={t('common.cancel', { defaultValue: 'Bekor qilish' })}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
