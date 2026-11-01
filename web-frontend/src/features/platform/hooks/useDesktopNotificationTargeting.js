import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../../api/company.api';
import { storeApi } from '../../../api/store.api';

export function useDesktopNotificationTargeting() {
  const [targetScope, setTargetScope] = useState('ALL'); // 'ALL' | 'SELECT'
  const [targetType, setTargetType] = useState('COMPANIES'); // 'COMPANIES' | 'STORES'
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);

  // Lazy fetch companies when in SELECT scope
  const isSelect = targetScope === 'SELECT';

  const companiesQuery = useQuery({
    queryKey: ['platform-companies-target-options'],
    queryFn: () =>
      companyApi
        .getAll({ page: 0, size: 200 })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data?.content || [])),
    enabled: isSelect && targetType === 'COMPANIES',
    staleTime: 60_000,
  });

  const storesQuery = useQuery({
    queryKey: ['platform-stores-target-options'],
    queryFn: () =>
      storeApi
        .getAll()
        .then((r) => (Array.isArray(r.data) ? r.data : r.data?.content || [])),
    enabled: isSelect && targetType === 'STORES',
    staleTime: 60_000,
  });

  const toggleCompanyId = useCallback((id) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleStoreId = useCallback((id) => {
    setSelectedStoreIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const clearTargetSelection = useCallback(() => {
    setSelectedCompanyIds([]);
    setSelectedStoreIds([]);
  }, []);

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
    setTargetType,
    selectedCompanyIds,
    setSelectedCompanyIds,
    selectedStoreIds,
    setSelectedStoreIds,
    toggleCompanyId,
    toggleStoreId,
    clearTargetSelection,
    hasValidTarget,
    selectedTargetCount,
    companies: companiesQuery.data || [],
    isCompaniesLoading: companiesQuery.isLoading,
    stores: storesQuery.data || [],
    isStoresLoading: storesQuery.isLoading,
  };
}
