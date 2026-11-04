import { useQuery } from '@tanstack/react-query';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { PHARMACY_EXTERNAL_URLS } from '../constants/pharmacyQuickLinks';
import { useShouldUseOfflinePos } from '../../../store/connectivityStore';

const DEFAULT_CAPABILITIES = {
  aslMarkingEnabled: false,
  dmedEnabled: true,
  aslPortalUrl: PHARMACY_EXTERNAL_URLS.aslPortal,
  dmedPortalUrl: PHARMACY_EXTERNAL_URLS.dmed,
  ikpuPortalUrl: PHARMACY_EXTERNAL_URLS.ikpu,
};

export function usePharmacyIntegrationConfig(storeId) {
  const skipOnline = useShouldUseOfflinePos();
  const query = useQuery({
    queryKey: ['pharmacy-integration', storeId],
    queryFn: () => pharmacyIntegrationApi.getCashierCapabilities(storeId).then((r) => r.data),
    enabled: Boolean(storeId) && !skipOnline,
    staleTime: 60_000,
    retry: skipOnline ? false : 1,
  });

  const capabilities = query.data ?? DEFAULT_CAPABILITIES;

  const externalUrls = {
    dmed: capabilities.dmedPortalUrl || PHARMACY_EXTERNAL_URLS.dmed,
    ikpu: capabilities.ikpuPortalUrl || PHARMACY_EXTERNAL_URLS.ikpu,
    aslPortal: capabilities.aslPortalUrl || PHARMACY_EXTERNAL_URLS.aslPortal,
    mygov: PHARMACY_EXTERNAL_URLS.mygov,
  };

  return {
    capabilities,
    externalUrls,
    isLoading: !skipOnline && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
