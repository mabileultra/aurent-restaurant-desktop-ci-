import React from 'react';
import TablePagination from '../../../../components/shared/TablePagination';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import TableLoadingOverlay from '../../../../components/shared/TableLoadingOverlay';
import UsersTableHeader from './UsersTableHeader';
import UsersTableRow from './UsersTableRow';
import UsersTableMobileCard from './UsersTableMobileCard';
import UsersTableBulkBar from './UsersTableBulkBar';

/**
 * UsersTable
 * Responsive controller component rendering desktop table and mobile cards for users.
 */
export default function UsersTable(props) {
  const {
    t, isPlatform, isLoading, isRefreshing = false, showOverlay = false,
    pageRows = [], page, displayPage, pageSize, total, totalPages,
    onPageChange, onPageSizeChange, menuId, onMenuOpenChange,
    onEdit, onToggleActive, onDelete, actorRole, currentUserId, currentUsername,
    companyById, onRowClick, sortField = 'fullName', sortDirection = 'asc', onSort,
    selectedUserIds = new Set(), onToggleSelectAll, onToggleSelectUser, onClearSelection,
    onBulkToggleActive, onExportSelectedCsv, onSelectAllMatching, isAllMatchingSelected = false,
    totalMatching = total, hasInactiveSelected = true, hasActiveSelected = true,
  } = props;

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

  return (
    <div className="relative">
      <div className="admin-table-shell overflow-hidden rounded-2xl bg-white shadow-2xs dark:bg-slate-900 relative">
        {isRefreshing && (
          <div className="absolute top-0 left-0 right-0 z-30 h-0.5 bg-purple-100 dark:bg-purple-950 overflow-hidden rounded-t-2xl">
            <div className="h-full bg-purple-600 animate-pulse w-full motion-reduce:animate-none" />
          </div>
        )}
        {showOverlay && <TableLoadingOverlay text={t('common.loading')} />}

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed border-collapse min-w-[760px]">
            <UsersTableHeader
              t={t}
              isPlatform={isPlatform}
              allSelected={allSelected}
              someSelected={someSelected}
              onToggleSelectAll={onToggleSelectAll}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: Math.min(pageSize || 10, 10) }).map((_, idx) => (
                  <tr key={`user-skeleton-${idx}`} className="animate-pulse motion-reduce:animate-none">
                    <td className="w-12 px-3 py-3.5 text-center"><div className="h-4 w-4 mx-auto rounded bg-slate-200 dark:bg-slate-700/60" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700/60" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700/60" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700/60" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700/60" /></td>
                    <td className="w-12 px-3 py-3.5" />
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700 dark:text-slate-300">{t('platform.noSearchResults')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('users.emptyFilterHint', { defaultValue: 'Qidiruv so\'rovi yoki filtrlarni o\'zgartirib ko\'ring' })}</p>
                  </td>
                </tr>
              ) : (
                pageRows.map((user) => (
                  <UsersTableRow
                    key={user.id}
                    user={user}
                    isSelected={selectedUserIds.has(String(user.id))}
                    isPlatform={isPlatform}
                    actorRole={actorRole}
                    currentUserId={currentUserId}
                    currentUsername={currentUsername}
                    company={companyById?.get?.(String(user.companyId ?? ''))}
                    menuOpen={menuId === user.id}
                    onMenuOpenChange={(next) => onMenuOpenChange?.(next ? user.id : null)}
                    onRowClick={onRowClick}
                    onToggleSelect={onToggleSelectUser}
                    onEdit={onEdit}
                    onToggleActive={onToggleActive}
                    onDelete={onDelete}
                    t={t}
                    businessTypeLabel={businessTypeLabel}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card-based view (<sm) */}
        <div className="sm:hidden p-3 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`user-card-skeleton-${idx}`} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 animate-pulse">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700/60" />
              </div>
            ))
          ) : pageRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">{t('platform.noSearchResults')}</div>
          ) : (
            pageRows.map((user) => (
              <UsersTableMobileCard
                key={user.id}
                user={user}
                isSelected={selectedUserIds.has(String(user.id))}
                company={companyById?.get?.(String(user.companyId ?? ''))}
                actorRole={actorRole}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                menuOpen={menuId === user.id}
                onMenuOpenChange={(next) => onMenuOpenChange?.(next ? user.id : null)}
                onRowClick={onRowClick}
                onToggleSelect={onToggleSelectUser}
                onEdit={onEdit}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
                t={t}
                regionName={regionName}
                districtName={districtName}
              />
            ))
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

      <UsersTableBulkBar
        selectedCount={selectedUserIds.size}
        allSelected={allSelected}
        totalMatching={totalMatching}
        pageSize={pageRows.length}
        isAllMatchingSelected={isAllMatchingSelected}
        onSelectAllMatching={onSelectAllMatching}
        hasInactiveSelected={hasInactiveSelected}
        hasActiveSelected={hasActiveSelected}
        onBulkToggleActive={onBulkToggleActive}
        onExportSelectedCsv={onExportSelectedCsv}
        onClearSelection={onClearSelection}
        t={t}
      />
    </div>
  );
}
