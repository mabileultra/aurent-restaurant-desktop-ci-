import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncRootTheme, syncPublicTheme, syncRestaurantTheme } from '../../store/themeStore';
import { isPublicAppPath } from '../../utils/publicAppPaths';

/** Тема страницы: публичный сайт, Restaurant OS, админка, касса. */
export default function AdminThemeSync() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (pathname.startsWith('/cashier')) return undefined;
    if (pathname.startsWith('/rst')) {
      syncRestaurantTheme();
      return undefined;
    }
    if (isPublicAppPath(pathname)) {
      syncPublicTheme();
      return undefined;
    }
    syncRootTheme();
    return undefined;
  }, [pathname]);

  return null;
}
