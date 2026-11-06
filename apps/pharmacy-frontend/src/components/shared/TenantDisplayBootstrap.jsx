import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { useShouldUseOfflinePos } from '../../store/connectivityStore';

/** Настройки чека и брендинга компании — сразу после входа, до печати. */
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
