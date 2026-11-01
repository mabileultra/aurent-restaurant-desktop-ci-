import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { useShouldUseOfflinePos } from '../../store/connectivityStore';

/** Loads company receipt/branding after login (web + Cashier shell on r-aurent). */
export default function TenantDisplayBootstrap({ children }) {
  const token = useAuthStore((s) => s.token);
  const skipOnline = useShouldUseOfflinePos();
  const fetchFromServer = useTenantDisplayStore((s) => s.fetchFromServer);

  useEffect(() => {
    if (token && !skipOnline) {
      fetchFromServer();
    }
  }, [token, skipOnline, fetchFromServer]);

  return children;
}
