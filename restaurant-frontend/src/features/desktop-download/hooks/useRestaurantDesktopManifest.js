import { useQuery } from '@tanstack/react-query';
import {
  fetchRestaurantInstallerManifest,
  resolveDownloadAssetUrl,
} from '../utils/restaurantInstallerManifest';
import { formatInstallerBytes } from '../utils/formatInstallerBytes';

export function useRestaurantDesktopManifest() {
  const query = useQuery({
    queryKey: ['restaurant-desktop-installer-manifest'],
    queryFn: fetchRestaurantInstallerManifest,
    staleTime: 60_000,
    retry: 1,
  });

  const manifest = query.data;
  const windowsUrl = resolveDownloadAssetUrl(manifest?.windows?.url);
  const macUrl = resolveDownloadAssetUrl(manifest?.mac?.url);

  return {
    version: manifest?.version || '',
    windows: {
      url: windowsUrl,
      sizeLabel: formatInstallerBytes(manifest?.windows?.size),
      available: Boolean(windowsUrl),
    },
    mac: {
      url: macUrl,
      sizeLabel: formatInstallerBytes(manifest?.mac?.size),
      available: Boolean(macUrl),
    },
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
