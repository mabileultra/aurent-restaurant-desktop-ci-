import React, { useMemo } from 'react';
import { Spinner } from '../../../../components/ui';
import TablePagination, { TABLE_PAGE_SIZE_OPTIONS_EXTENDED } from '../../../../components/shared/TablePagination';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import StoresGroupedCompanyCard from './stores-grouped/StoresGroupedCompanyCard';
import StoresGroupedEmpty from './stores-grouped/StoresGroupedEmpty';
import StoresGroupedSkeleton from './stores-grouped/StoresGroupedSkeleton';
import StoresGroupedToolbar from './stores-grouped/StoresGroupedToolbar';
import { usePlatformStoresGroupedUi } from './stores-grouped/usePlatformStoresGroupedUi';

/**
 * Thin facade: server-paged company accordion + lazy branches (or legacy client groups).
 */
export default function PlatformStoresGroupedView(props) {
  const {
    t,
    stores = [],
    isPending = false,
    isRefreshing = false,
    showOverlay = false,
    loadingBranchIds = null,
    menuId = null,
    onMenuOpenChange,
    onEdit,
    onToggleActive,
    onDelete,
    onPharmacyIntegration,
    onSelectStore,
    openCreateForCompany,
  } = props;

  const ui = usePlatformStoresGroupedUi(props);

  const regionCodes = useMemo(
    () => (stores || []).map((r) => r.regionCode).filter(Boolean),
    [stores]
  );
  const { regionName, districtName, empty } = useGeoNameLookup(regionCodes);

  if (isPending) {
    return <StoresGroupedSkeleton />;
  }

  if (ui.companyGroups.length === 0) {
    return <StoresGroupedEmpty t={t} />;
  }

  return (
    <div className="space-y-3 relative">
      {isRefreshing && (
        <div className="absolute -top-1 left-0 right-0 z-30 h-0.5 bg-emerald-100 dark:bg-emerald-950 overflow-hidden rounded-full">
          <div className="h-full bg-emerald-500 animate-pulse w-full motion-reduce:animate-none" />
        </div>
      )}
      {showOverlay && <Spinner overlay size="sm" text={t('common.loading')} />}

      <StoresGroupedToolbar
        t={t}
        total={ui.total}
        branchCount={ui.branchCountOnPage}
        allAreExpanded={ui.allAreExpanded}
        onExpandAll={ui.expandAll}
        onCollapseAll={ui.collapseAll}
      />

      <div className="space-y-3">
        {ui.pagedGroups.map((group) => (
          <StoresGroupedCompanyCard
            key={group.id}
            t={t}
            group={group}
            isExpanded={ui.effectiveExpanded.has(group.id)}
            isHighlighted={
              ui.highlightedId != null
              && (group.id === ui.highlightedId
                || String(group.id) === String(ui.highlightedId)
                || Number(group.id) === Number(ui.highlightedId))
            }
            loadingBranches={Boolean(loadingBranchIds?.has?.(group.id))}
            onToggle={ui.toggleGroup}
            openCreateForCompany={openCreateForCompany}
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
      </div>

      {ui.total > 0 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <TablePagination
            page={ui.safePage}
            pageSize={ui.pageSize}
            total={ui.total}
            totalPages={ui.totalPages}
            onPageChange={(newPage) => {
              ui.setPage(newPage);
              if (typeof window !== 'undefined') {
                document.getElementById('stores-grouped-toolbar')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }
            }}
            onPageSizeChange={(newSize) => {
              ui.setPageSize(newSize);
              ui.setPage(0);
            }}
            pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS_EXTENDED}
            className="border-t-0"
          />
        </div>
      )}
    </div>
  );
}
