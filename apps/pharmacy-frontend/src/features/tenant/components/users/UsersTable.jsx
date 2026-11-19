import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Download,
  KeyRound,
  MapPin,
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
import { Spinner } from '../../../../components/ui';

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
  isRefreshing = false,
  showOverlay = false,
  pageRows = [],
  page,
  displayPage,
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
  const effectivePage = typeof displayPage === 'number' ? displayPage : page;
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
      return <ArrowUpDown size={13} className="text-ink-muted group-hover:text-ink" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={13} className="text-primary-600" />
    ) : (
      <ArrowDown size={13} className="text-primary-600" />
    );
  };

  const getSortAria = (field) => {
    if (sortField !== field) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="relative">
      <div className="ui-table-wrap relative">
        {/* Indeterminate primary progress line during background refetching */}
        {isRefreshing && (
          <div className="absolute top-0 left-0 right-0 z-30 h-0.5 bg-primary-100 overflow-hidden rounded-t-card">
            <div className="h-full bg-primary-500 animate-pulse w-full motion-reduce:animate-none" />
          </div>
        )}

        {/* Anti-flicker delayed overlay spinner (appears only if request persists > 250ms, holds >= 400ms) */}
        {showOverlay && (
          <Spinner overlay size="sm" text={t('common.loading')} />
        )}
        <div className="hidden sm:block overflow-x-auto">
          <table className="ui-table table-fixed min-w-[760px]">
            <thead>
              <tr>
                
                {/* Checkbox select */}
                <th className="w-12 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onToggleSelectAll?.(e.target.checked)}
                    aria-label={t('common.selectAll', { defaultValue: 'Barchasini tanlash' })}
                    className="rounded border-line-strong text-primary-600 accent-primary-600 focus:ring-primary-500"
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
                  className="w-[34%] min-w-[220px] px-4 py-3 cursor-pointer select-none group focus:outline-none focus:bg-primary-50"
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
                  className="w-[18%] min-w-[120px] px-4 py-3 cursor-pointer select-none group focus:outline-none focus:bg-primary-50"
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
                  className="w-[32%] min-w-[200px] px-4 py-3 cursor-pointer select-none group focus:outline-none focus:bg-primary-50"
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
                  className="w-[16%] min-w-[100px] px-4 py-3 cursor-pointer select-none group focus:outline-none focus:bg-primary-50"
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>{t('users.colActive')}</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                {/* Actions */}
                <th className="admin-table-sticky-end w-12 px-3 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                Array.from({ length: Math.min(pageSize || 10, 10) }).map((_, idx) => (
                  <tr key={`user-skeleton-${idx}`} className="animate-pulse motion-reduce:animate-none">
                    <td className="w-12 px-3 py-3.5 text-center">
                      <div className="h-4 w-4 mx-auto rounded bg-primary-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-100 shrink-0" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="h-4 w-32 rounded bg-primary-100" />
                          <div className="h-3 w-20 rounded bg-canvas" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-20 rounded-full bg-primary-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 rounded bg-primary-100" />
                        <div className="h-3 w-16 rounded bg-canvas" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-14 rounded-full bg-primary-100" />
                    </td>
                    <td className="w-12 px-3 py-3.5" />
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center text-ink-muted">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-medium text-ink">
                        {t('platform.noSearchResults')}
                      </p>
                      <p className="text-xs text-ink-muted">
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
                        isSelected ? 'bg-primary-50/70 hover:bg-primary-100/60' : 'hover:bg-primary-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectUser?.(user.id)}
                          aria-label={t('users.selectUser', { name: displayName, defaultValue: 'Foydalanuvchini tanlash' })}
                          className="rounded border-line-strong text-primary-600 accent-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>

                      {/* Foydalanuvchi (Ism, username · phone) */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-ink truncate">
                            {displayName}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-0.5 truncate">
                            <span className="font-mono text-ink font-medium">
                              {user.username}
                            </span>
                            {user.phone ? (
                              <>
                                <span className="text-line-strong">·</span>
                                <span className="text-ink-muted font-mono text-[11px] ui-tabular">
                                  {user.phone}
                                </span>
                              </>
                            ) : user.email ? (
                              <>
                                <span className="text-line-strong">·</span>
                                <span className="text-ink-muted truncate max-w-[140px]">
                                  {user.email}
                                </span>
                              </>
                            ) : null}
                          </div>
                          {/* Compact security credential badge with title */}
                          <div
                            className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-ink-muted"
                            title={securityTooltip}
                          >
                            <KeyRound size={11} className="text-ink-muted shrink-0" />
                            <span className="truncate">{securityTooltip}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            USER_ROLE_BADGE[user.role] ?? 'ui-badge-neutral'
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
                              <span className="font-medium text-ink truncate">
                                {user.companyName || company?.name || '—'}
                              </span>
                              {loginCode ? (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-primary-50 text-primary-700 border border-primary-200 ui-tabular"
                                  title={`${t('users.companyLoginCode', { defaultValue: 'Kompaniya kodi' })}: #${loginCode}`}
                                >
                                  #{loginCode}
                                </span>
                              ) : null}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-ink-muted mt-0.5">
                            {user.storeNames?.length ? (
                              <span className="truncate" title={user.storeNames.join(', ')}>
                                {user.storeNames.join(', ')}
                              </span>
                            ) : (
                              <span className="text-ink-muted">Filialsiz</span>
                            )}
                            {isPlatform && (
                              <>
                                <span className="text-line-strong">·</span>
                                <span className="text-[11px] text-ink-muted">
                                  {businessTypeLabel(user)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Holat (Active / Inactive badge) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`gap-1.5 ${
                            user.active ? 'ui-badge-success' : 'ui-badge-neutral'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-success' : 'bg-ink-disabled'}`} />
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
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`user-card-skeleton-${idx}`} className="p-3.5 rounded-card border border-line bg-surface animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded bg-primary-100" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 rounded bg-primary-100" />
                    <div className="h-3 w-20 rounded bg-canvas" />
                  </div>
                </div>
              </div>
            ))
          ) : pageRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">
              {t('platform.noSearchResults')}
            </div>
          ) : (
            pageRows.map((user) => {
              const displayName = user.fullName || user.username;
              const isSelected = selectedUserIds.has(String(user.id));
              const company = companyById?.get?.(String(user.companyId ?? ''));
              const compName = user.companyName || company?.name;
              const loginCode = user.companyLoginCode || company?.loginCode;
              const rCode = user.regionCode || company?.regionCode;
              const dCode = user.districtCode || company?.districtCode;
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
                  className={`p-3.5 rounded-card border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary-300 bg-primary-50/70'
                      : 'border-line bg-surface hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectUser?.(user.id)}
                        aria-label={t('users.selectUser', { name: displayName, defaultValue: 'Foydalanuvchini tanlash' })}
                        className="mt-1 h-4 w-4 rounded border-line-strong text-primary-600 accent-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate text-sm">
                          {displayName}
                        </p>
                        <p className="text-xs text-ink-muted font-mono ui-tabular mt-0.5 truncate">
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
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        USER_ROLE_BADGE[user.role] ?? 'ui-badge-neutral'
                      }`}
                    >
                      {t(`roles.${user.role}`, user.role)}
                    </span>
                    <span
                      className={`gap-1.5 ${
                        user.active ? 'ui-badge-success' : 'ui-badge-neutral'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-success' : 'bg-ink-disabled'}`} />
                      {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
                    </span>
                    {compName ? (
                      <span
                        className="text-ink-muted font-medium truncate max-w-[140px]"
                        title={compName}
                      >
                        {compName}
                      </span>
                    ) : null}
                    {loginCode ? (
                      <span
                        className="font-mono text-[10px] font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200 ui-tabular shrink-0"
                        title={`${t('users.companyLoginCode', { defaultValue: 'Kompaniya kodi' })}: #${loginCode}`}
                      >
                        #{loginCode}
                      </span>
                    ) : null}
                    {userLocation ? (
                      <span className="inline-flex items-center gap-1 text-ink-muted text-[11px] truncate max-w-full">
                        <MapPin size={11} className="shrink-0 text-ink-muted" aria-hidden="true" />
                        <span className="truncate">{userLocation}</span>
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
          displayPage={effectivePage}
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
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-card bg-surface text-ink shadow-elevated border border-line-strong max-w-full">
            <div className="flex items-center gap-2 pr-2 border-r border-line text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span>
                {t('users.selectedCount', { count: selectedUserIds.size, defaultValue: `${selectedUserIds.size} ta tanlandi` })}
              </span>
              {allSelected && totalMatching > pageRows.length && (
                !isAllMatchingSelected ? (
                  <button
                    type="button"
                    onClick={onSelectAllMatching}
                    className="ml-1 text-[11px] font-medium text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    {t('users.selectAllMatching', { total: totalMatching, defaultValue: `Barcha ${totalMatching} tasini tanlash` })}
                  </button>
                ) : (
                  <span className="ml-1 text-[11px] text-success-text font-medium">
                    {t('users.allMatchingSelected', { total: totalMatching, defaultValue: `Barcha ${totalMatching} ta tanlangan` })}
                  </span>
                )
              )}
            </div>

            {hasInactiveSelected && (
              <button
                type="button"
                onClick={() => onBulkToggleActive?.(true)}
                className="ui-btn-secondary h-8 px-3 text-xs text-success-text border-success/30 hover:bg-success-soft"
              >
                <UserCheck size={14} className="text-success" />
                <span>{t('users.activate', { defaultValue: 'Faollashtirish' })}</span>
              </button>
            )}

            {hasActiveSelected && (
              <button
                type="button"
                onClick={() => onBulkToggleActive?.(false)}
                className="ui-btn-secondary h-8 px-3 text-xs text-warning-text border-warning/30 hover:bg-warning-soft"
              >
                <UserX size={14} className="text-warning" />
                <span>{t('users.deactivate', { defaultValue: 'Faolsizlantirish' })}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExportSelectedCsv}
              className="ui-btn-secondary h-8 px-3 text-xs"
            >
              <Download size={14} className="text-primary-600" />
              <span>{t('common.exportCsv', { defaultValue: 'Eksport (CSV)' })}</span>
            </button>

            <button
              type="button"
              onClick={onClearSelection}
              className="ui-icon-btn h-8 w-8 ml-1"
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
