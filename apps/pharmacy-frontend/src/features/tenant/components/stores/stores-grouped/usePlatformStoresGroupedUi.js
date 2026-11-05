import { useEffect, useMemo, useState } from 'react';
import { buildClientCompanyGroups } from './buildClientCompanyGroups';
import { clearStoresFocusFromUrl, resolveStoresFocusCompanyId } from './resolveStoresFocusCompanyId';

export function usePlatformStoresGroupedUi({
  t,
  stores,
  companies,
  serverGroups,
  serverPaged,
  serverTotalGroups,
  companyId,
  focusCompanyId,
  search,
  businessType,
  regionCode,
  districtCode,
  statusFilter,
  expandedIds: controlledExpandedIds,
  onExpandedIdsChange,
  hasUserToggled: controlledHasUserToggled,
  onHasUserToggledChange,
  page: controlledPage,
  onPageChange: onControlledPageChange,
  pageSize: controlledPageSize,
  onPageSizeChange: onControlledPageSizeChange,
}) {
  const [internalExpandedIds, setInternalExpandedIds] = useState(() => new Set());
  const [internalHasUserToggled, setInternalHasUserToggled] = useState(false);
  const [internalPage, setInternalPage] = useState(0);
  const [internalPageSize, setInternalPageSize] = useState(10);

  const expandedIds = controlledExpandedIds ?? internalExpandedIds;
  const setExpandedIds = onExpandedIdsChange ?? setInternalExpandedIds;
  const hasUserToggled = controlledHasUserToggled ?? internalHasUserToggled;
  const setHasUserToggled = onHasUserToggledChange ?? setInternalHasUserToggled;
  const page = controlledPage ?? internalPage;
  const setPage = onControlledPageChange ?? setInternalPage;
  const pageSize = controlledPageSize ?? internalPageSize;
  const setPageSize = onControlledPageSizeChange ?? setInternalPageSize;

  const targetFocusId = useMemo(
    () => resolveStoresFocusCompanyId(focusCompanyId),
    [focusCompanyId]
  );
  const [highlightedId, setHighlightedId] = useState(targetFocusId);

  const { groups: clientGroups, filteredStores } = useMemo(() => {
    if (serverGroups) {
      return {
        groups: serverGroups,
        filteredStores: serverGroups.flatMap((g) => g.stores || []),
      };
    }
    return buildClientCompanyGroups({
      stores,
      companies,
      companyId,
      search,
      businessType,
      regionCode,
      districtCode,
      statusFilter,
      orphanLabel: t('platform.colCompanyGeneral', { defaultValue: 'Umumiy / Biriktirilmagan' }),
    });
  }, [
    serverGroups,
    stores,
    companies,
    companyId,
    search,
    businessType,
    regionCode,
    districtCode,
    statusFilter,
    t,
  ]);

  const companyGroups = clientGroups;
  const isActivelyFiltering = Boolean(
    search || businessType || regionCode || districtCode || statusFilter !== 'ALL' || companyId
  );

  const effectiveExpanded = useMemo(() => {
    if (hasUserToggled) return expandedIds;
    const autoSet = new Set();
    if (targetFocusId != null) autoSet.add(targetFocusId);
    if (isActivelyFiltering || companyGroups.length <= 2) {
      companyGroups.forEach((g) => {
        if (g.stores.length > 0) autoSet.add(g.id);
      });
    }
    return autoSet;
  }, [hasUserToggled, expandedIds, companyGroups, isActivelyFiltering, targetFocusId]);

  useEffect(() => {
    setPage(0);
  }, [search, businessType, regionCode, districtCode, statusFilter, companyId, setPage]);

  useEffect(() => {
    if (targetFocusId == null || serverPaged) return;
    const targetIndex = companyGroups.findIndex(
      (g) =>
        g.id === targetFocusId
        || String(g.id) === String(targetFocusId)
        || Number(g.id) === Number(targetFocusId)
    );
    if (targetIndex >= 0) {
      const targetPage = Math.floor(targetIndex / pageSize);
      if (page !== targetPage) setPage(targetPage);
    }
  }, [targetFocusId, companyGroups, pageSize, page, setPage, serverPaged]);

  const total = serverPaged ? serverTotalGroups : companyGroups.length;
  const totalPages = Math.max(1, pageSize > 0 ? Math.ceil(total / pageSize) : 1);
  const safePage = page >= totalPages ? Math.max(0, totalPages - 1) : Math.max(0, page);
  const pagedGroups = useMemo(() => {
    if (serverPaged) return companyGroups;
    const start = safePage * pageSize;
    return companyGroups.slice(start, start + pageSize);
  }, [serverPaged, companyGroups, safePage, pageSize]);

  useEffect(() => {
    if (targetFocusId == null) return;
    setHasUserToggled(false);
    setHighlightedId(targetFocusId);
    const scrollTimer = setTimeout(() => {
      document.getElementById(`company-group-${targetFocusId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      clearStoresFocusFromUrl();
    }, 150);
    const highlightTimer = setTimeout(() => setHighlightedId(null), 3500);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(highlightTimer);
    };
  }, [targetFocusId, safePage, companyGroups.length, setHasUserToggled]);

  const toggleGroup = (id) => {
    setHasUserToggled(true);
    setExpandedIds((prev) => {
      const next = new Set(hasUserToggled ? prev : effectiveExpanded);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setHasUserToggled(true);
    setExpandedIds(new Set(companyGroups.map((g) => g.id)));
  };

  const collapseAll = () => {
    setHasUserToggled(true);
    setExpandedIds(new Set());
  };

  const allAreExpanded =
    companyGroups.length > 0 && companyGroups.every((g) => effectiveExpanded.has(g.id));

  const branchCountOnPage = serverPaged
    ? companyGroups.reduce((sum, g) => sum + (Number(g.total) || 0), 0)
    : filteredStores.length;

  return {
    companyGroups,
    pagedGroups,
    total,
    totalPages,
    safePage,
    pageSize,
    setPage,
    setPageSize,
    effectiveExpanded,
    highlightedId,
    toggleGroup,
    expandAll,
    collapseAll,
    allAreExpanded,
    branchCountOnPage,
  };
}
