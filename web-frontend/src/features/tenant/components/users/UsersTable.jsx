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
  onSelectAllMatching,
  isAllMatchingSelected = false,
  totalMatching = total,
  hasInactiveSelected = true,
  hasActiveSelected = true,
}) {
  const colSpan = 6;
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
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed border-collapse min-w-[760px]">
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
                  className="w-[34%] min-w-[220px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
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
                  className="w-[18%] min-w-[120px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
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
                  className="w-[32%] min-w-[200px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
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
                  className="w-[16%] min-w-[100px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>{t('users.colActive')}</span>
                    {renderSortIcon('status')}
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
                      id={`user-row-${user.id}`}
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
                                ? (user.active
                                    ? t('users.deleteRestrictedActive', { defaultValue: 'Bu rolni o‘chirib bo‘lmaydi — faolsizlantiring' })
                                    : t('users.deleteRestrictedInactive', { defaultValue: 'Ushbu roldagi foydalanuvchini butunlay o‘chirib bo‘lmaydi' }))
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

        {/* Mobile card-based view (<sm) */}
        <div className="sm:hidden p-3 space-y-3">
          {pageRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {isLoading ? t('common.loading') : t('platform.noSearchResults')}
            </div>
          ) : (
            pageRows.map((user) => {
              const displayName = user.fullName || user.username;
              const isSelected = selectedUserIds.has(String(user.id));
              const rCode = user.regionCode || companyById?.get?.(String(user.companyId ?? ''))?.regionCode;
              const dCode = user.districtCode || companyById?.get?.(String(user.companyId ?? ''))?.districtCode;
              const userRegion = rCode ? regionName(rCode) : '';
              const userDistrict = dCode ? districtName(dCode) : '';
              const isPlaceholder = (val) => !val || val === 'Yo‘q' || val === 'Yo\'q' || val === 'Нет';
              const validRegion = isPlaceholder(userRegion) ? '' : userRegion;
              const validDistrict = isPlaceholder(userDistrict) ? '' : userDistrict;
              const userLocation = [validRegion, validDistrict].filter(Boolean).join(' · ');

              return (
                <div
                  key={user.id}
                  id={`user-card-${user.id}`}
                  onClick={() => onRowClick?.(user)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectUser?.(user.id)}
                        aria-label={t('users.selectUser', { name: displayName, defaultValue: 'Foydalanuvchini tanlash' })}
                        className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                          {user.username} {user.phone ? `· ${user.phone}` : ''}
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <TableRowActionsMenu
                        t={t}
                        isOpen={menuId === user.id}
                        onOpenChange={(next) => onMenuOpenChange?.(next ? user.id : null)}
                        actions={[
                          {
                            label: t('common.edit'),
                            onClick: () => onEdit(user),
                          },
                          {
                            label: user.active
                              ? t('users.deactivate', { defaultValue: 'Faolsizlantirish' })
                              : t('users.activate', { defaultValue: 'Faollashtirish' }),
                            onClick: () => onToggleActive(user.id),
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
                              ? (user.active
                                  ? t('users.deleteRestrictedActive', { defaultValue: 'Bu rolni o‘chirib bo‘lmaydi — faolsizlantiring' })
                                  : t('users.deleteRestrictedInactive', { defaultValue: 'Ushbu roldagi foydalanuvchini butunlay o‘chirib bo‘lmaydi' }))
                              : undefined,
                          },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${
                        USER_ROLE_BADGE[user.role] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {t(`roles.${user.role}`, user.role)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        user.active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
                    </span>
                    {user.companyName ? (
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                        {user.companyName} {user.companyLoginCode ? `#${user.companyLoginCode}` : ''}
                      </span>
                    ) : null}
                    {userLocation ? (
                      <span className="text-slate-400 dark:text-slate-500 truncate text-[11px]">
                        {user.companyName ? '· ' : ''}{userLocation}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
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
        <div className="sticky bottom-6 flex justify-center z-30 pointer-events-none mt-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-full">
            <div className="flex items-center gap-2 pr-2 border-r border-slate-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>
                {t('users.selectedCount', { count: selectedUserIds.size, defaultValue: `${selectedUserIds.size} ta tanlandi` })}
              </span>
              {allSelected && totalMatching > pageRows.length && (
                !isAllMatchingSelected ? (
                  <button
                    type="button"
                    onClick={onSelectAllMatching}
                    className="ml-1 text-[11px] text-purple-300 hover:text-purple-200 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    {t('users.selectAllMatching', { total: totalMatching, defaultValue: `Barcha ${totalMatching} tasini tanlash` })}
                  </button>
                ) : (
                  <span className="ml-1 text-[11px] text-emerald-400 font-medium">
                    {t('users.allMatchingSelected', { total: totalMatching, defaultValue: `Barcha ${totalMatching} ta tanlangan` })}
                  </span>
                )
              )}
            </div>

            {hasInactiveSelected && (
              <button
                type="button"
                onClick={() => onBulkToggleActive?.(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300 border border-slate-700 hover:border-emerald-500/40 transition-colors cursor-pointer"
              >
                <UserCheck size={14} className="text-emerald-400" />
                <span>{t('users.activate', { defaultValue: 'Faollashtirish' })}</span>
              </button>
            )}

            {hasActiveSelected && (
              <button
                type="button"
                onClick={() => onBulkToggleActive?.(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-colors cursor-pointer"
              >
                <UserX size={14} className="text-amber-400" />
                <span>{t('users.deactivate', { defaultValue: 'Faolsizlantirish' })}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExportSelectedCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
            >
              <Download size={14} className="text-purple-400" />
              <span>{t('common.exportCsv', { defaultValue: 'Eksport (CSV)' })}</span>
            </button>

            <button
              type="button"
              onClick={onClearSelection}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              aria-label={t('common.cancel', { defaultValue: 'Bekor qilish' })}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
