import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { useShouldUseOfflinePos } from '../../store/connectivityStore';

/** Загружает настройки брендинга/чека с сервера после входа (веб и десктоп). */
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
