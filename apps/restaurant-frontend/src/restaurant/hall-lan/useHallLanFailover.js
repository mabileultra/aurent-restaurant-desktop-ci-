import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hallPresenceApi } from '../api/hallPresence.api';
import { useRestaurantWorkspaceStore } from '../shared/hooks/useRestaurantWorkspaceStore';
import { isRestaurantDesktop } from '../../utils/restaurantDesktop';
import { isAlreadyOnLanHub } from './isAlreadyOnLanHub';
import { shouldShowHallLanSwitch } from './shouldShowHallLanSwitch';
import { buildLanSwitchHref } from './buildLanSwitchHref';

const POLL_MS = 12_000;

export function useHallLanFailover() {
  const workspace = useRestaurantWorkspaceStore();
  const isDesktop = isRestaurantDesktop();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const skip = isDesktop || isAlreadyOnLanHub(hostname);

  const query = useQuery({
    queryKey: ['rst-hall-presence', workspace.storeId],
    queryFn: () => hallPresenceApi.status(workspace.storeId).then((r) => r.data),
    enabled: !skip && workspace.storeId != null,
    refetchInterval: POLL_MS,
    staleTime: 8_000,
    retry: 1,
  });

  const presence = query.data || null;
  const show = shouldShowHallLanSwitch({
    isDesktop,
    hostname,
    presence,
  });

  const lanHubUrls = useMemo(() => {
    const raw = presence?.lanHubUrls;
    return Array.isArray(raw) ? raw.filter(Boolean) : [];
  }, [presence]);

  const primaryHref = lanHubUrls.length
    ? buildLanSwitchHref(lanHubUrls[0])
    : '';

  return {
    show,
    lanHubUrls,
    primaryHref,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
