import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../../api/company.api';
import { storeApi } from '../../../api/store.api';

const TARGET_PAGE_SIZE = 30;

export function useDesktopNotificationTargeting() {
  const [targetScope, setTargetScope] = useState('ALL'); // 'ALL' | 'SELECT'
  const [targetType, setTargetType] = useState('COMPANIES'); // 'COMPANIES' | 'STORES'
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const isSelect = targetScope === 'SELECT';

  // Handle switching targetType cleanly without hidden phantom state
  const handleSetTargetType = useCallback((nextType) => {
    setTargetType(nextType);
    if (nextType === 'COMPANIES') {
      setSelectedStoreIds([]);
      setSelectedStores([]);
    } else if (nextType === 'STORES') {
      setSelectedCompanyIds([]);
      setSelectedCompanies([]);
    }
    setSearchQuery('');
  }, []);

  // Server-searched companies with limit 30 (prevents full-table size=200 scans)
  const companiesQuery = useQuery({
    queryKey: ['platform-companies-target-options', searchQuery],
    queryFn: () =>
      companyApi
        .getAll({
          page: 0,
          size: TARGET_PAGE_SIZE,
          search: searchQuery.trim() || undefined,
          sort: 'name,asc',
        })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data?.content || [])),
    enabled: isSelect && targetType === 'COMPANIES',
    staleTime: 30_000,
  });

  // Server-searched managed stores with limit 30 (prevents full-table /stores scan and includes companyName)
  const storesQuery = useQuery({
    queryKey: ['platform-stores-target-options', searchQuery],
    queryFn: () =>
      storeApi
        .getManaged({
          page: 0,
          size: TARGET_PAGE_SIZE,
          search: searchQuery.trim() || undefined,
          sort: 'name,asc',
        })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data?.content || [])),
    enabled: isSelect && targetType === 'STORES',
    staleTime: 30_000,
  });

  const toggleCompany = useCallback((company) => {
    const id = company.id;
    setSelectedCompanyIds((prevIds) => {
      const isSelected = prevIds.includes(id);
      if (isSelected) {
        setSelectedCompanies((prev) => prev.filter((c) => c.id !== id));
        return prevIds.filter((item) => item !== id);
      }
      setSelectedCompanies((prev) => [...prev.filter((c) => c.id !== id), company]);
      return [...prevIds, id];
    });
  }, []);

  const toggleStore = useCallback((store) => {
    const id = store.id;
    setSelectedStoreIds((prevIds) => {
      const isSelected = prevIds.includes(id);
      if (isSelected) {
        setSelectedStores((prev) => prev.filter((s) => s.id !== id));
        return prevIds.filter((item) => item !== id);
      }
      setSelectedStores((prev) => [...prev.filter((s) => s.id !== id), store]);
      return [...prevIds, id];
    });
  }, []);

  const clearTargetSelection = useCallback(() => {
    setSelectedCompanyIds([]);
    setSelectedStoreIds([]);
    setSelectedCompanies([]);
    setSelectedStores([]);
  }, []);

  // Merge selected entities into query data so checked items are always visible
  const mergedCompanies = useMemo(() => {
    const fetched = companiesQuery.data || [];
    const map = new Map();
    selectedCompanies.forEach((c) => map.set(c.id, c));
    fetched.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [companiesQuery.data, selectedCompanies]);

  const mergedStores = useMemo(() => {
    const fetched = storesQuery.data || [];
    const map = new Map();
    selectedStores.forEach((s) => map.set(s.id, s));
    fetched.forEach((s) => map.set(s.id, s));
    return Array.from(map.values());
  }, [storesQuery.data, selectedStores]);

  const hasValidTarget = useMemo(() => {
    if (targetScope === 'ALL') return true;
    if (targetType === 'COMPANIES') return selectedCompanyIds.length > 0;
    if (targetType === 'STORES') return selectedStoreIds.length > 0;
    return false;
  }, [targetScope, targetType, selectedCompanyIds, selectedStoreIds]);

  const selectedTargetCount = useMemo(() => {
    if (targetScope === 'ALL') return null;
    return targetType === 'COMPANIES' ? selectedCompanyIds.length : selectedStoreIds.length;
  }, [targetScope, targetType, selectedCompanyIds, selectedStoreIds]);

  return {
    targetScope,
    setTargetScope,
    targetType,
    setTargetType: handleSetTargetType,
    selectedCompanyIds,
    setSelectedCompanyIds,
    selectedStoreIds,
    setSelectedStoreIds,
    selectedCompanies,
    setSelectedCompanies,
    selectedStores,
    setSelectedStores,
    toggleCompanyId: (id) => {
      const found = mergedCompanies.find((c) => c.id === id) || { id, name: `Company #${id}` };
      toggleCompany(found);
    },
    toggleStoreId: (id) => {
      const found = mergedStores.find((s) => s.id === id) || { id, name: `Store #${id}` };
      toggleStore(found);
    },
    toggleCompany,
    toggleStore,
    clearTargetSelection,
    hasValidTarget,
    selectedTargetCount,
    searchQuery,
    setSearchQuery,
    companies: mergedCompanies,
    isCompaniesLoading: companiesQuery.isLoading,
    stores: mergedStores,
    isStoresLoading: storesQuery.isLoading,
  };
}
