import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncRootTheme } from '../../store/themeStore';

export default function AdminThemeSync() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (pathname.startsWith('/pos') || pathname.startsWith('/login') || pathname.startsWith('/cashier')) {
      return undefined;
    }
    syncRootTheme();
    return undefined;
  }, [pathname]);

  return null;
}

