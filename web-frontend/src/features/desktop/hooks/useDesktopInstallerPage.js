import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  fetchInstallerManifest,
  fetchRestaurantInstallerManifest,
} from '../utils/installerManifestApi';
import { formatInstallerDate } from '../utils/installerFormatUtils';

function useManifestQuery(key, fetcher) {
  const { i18n } = useTranslation();
  const query = useQuery({
    queryKey: [key],
    queryFn: fetcher,
    staleTime: 60_000,
    retry: 1,
  });
  const manifest = query.data;
  return {
    manifest,
    version: manifest?.version,
    releasedAt: formatInstallerDate(manifest?.releasedAt, i18n.language),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useDesktopInstallerPage() {
  const cashier = useManifestQuery('desktop-installer-manifest', fetchInstallerManifest);
  const restaurant = useManifestQuery(
    'restaurant-desktop-installer-manifest',
    fetchRestaurantInstallerManifest
  );

  return { cashier, restaurant };
}
