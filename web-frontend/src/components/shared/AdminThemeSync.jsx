import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncRootTheme, syncPublicTheme } from '../../store/themeStore';
import { isPublicAppPath } from '../../utils/publicAppPaths';

/** Тема страницы: публичный сайт — тёмная, админка — светлая, касса — своя. */
export default function AdminThemeSync() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (pathname.startsWith('/cashier')) return undefined;
    if (isPublicAppPath(pathname)) {
      syncPublicTheme();
      return undefined;
    }
    syncRootTheme();
    return undefined;
  }, [pathname]);

  return null;
}
