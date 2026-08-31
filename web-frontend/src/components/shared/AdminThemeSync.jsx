import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncRootTheme } from '../../store/themeStore';

/** Вне /cashier — светлая тема на <html>, иначе Windows Electron красит инпуты в чёрный. */
export default function AdminThemeSync() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (pathname.startsWith('/cashier')) return undefined;
    syncRootTheme();
    return undefined;
  }, [pathname]);

  return null;
}
