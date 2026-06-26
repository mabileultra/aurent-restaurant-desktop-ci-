import { useQuery } from '@tanstack/react-query';
import { companyBusinessTypeApi } from '../api';
import { useCompanyBusinessType } from './useCompanyBusinessType';

/**
 * Типы бизнеса для формы магазина.
 * В platform-режиме — по выбранной companyId; в tenant — текущая компания.
 */
export function useStoreFormBusinessTypes(companyId, { platformMode = false } = {}) {
  const tenant = useCompanyBusinessType();

  const platformQuery = useQuery({
    queryKey: ['company-business-types', companyId],
    queryFn: () => companyBusinessTypeApi.getForCompany(Number(companyId)).then((r) => r.data),
    enabled: platformMode && companyId != null && String(companyId).trim() !== '',
    staleTime: 60_000,
  });

  if (platformMode) {
    const types = platformQuery.data?.types ?? [];
    return {
      types,
      defaultTypeCode: platformQuery.data?.defaultTypeCode ?? 'UNIVERSAL',
      isLoading: Boolean(companyId) && platformQuery.isPending,
      needsCompany: !companyId,
    };
  }

  return {
    types: tenant.types,
    defaultTypeCode: tenant.defaultTypeCode,
    isLoading: tenant.isLoading,
    needsCompany: false,
  };
}
