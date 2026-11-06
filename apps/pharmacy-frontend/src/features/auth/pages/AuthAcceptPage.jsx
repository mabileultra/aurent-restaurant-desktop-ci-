import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../../api/auth.api';
import { useAuthStore } from '../../../store/authStore';
import { getMainAppUrl } from '../../../config/env';
import { PHARM_POS_PATH } from '../../../pharmacy/app/pharmacyPaths';
import {
  clearHandoffCodeFromUrl,
  readHandoffCodeFromSearch,
  safePharmacyNextPath,
} from '../../../utils/sessionHandoff';
import { mapAuthResponseToUser } from '../utils/mapAuthResponseToUser';

/**
 * Exchanges one-time Identity handoff code (?code=) for a pharmacy session.
 * JWT never appears in the URL.
 */
export default function AuthAcceptPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const code = readHandoffCodeFromSearch(searchParams);
      clearHandoffCodeFromUrl();
      if (!code) {
        setError('Нет кода входа. Откройте вход с aurent.uz или страницу логина.');
        return;
      }
      try {
        const { data } = await authApi.exchangeHandoff(code);
        if (cancelled) return;
        setAuth(data.token, mapAuthResponseToUser(data));
        const next = safePharmacyNextPath(searchParams.get('next')) || PHARM_POS_PATH;
        navigate(next, { replace: true });
      } catch {
        if (!cancelled) {
          setError('Код недействителен или истёк. Войдите снова с платформы.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, setAuth, searchParams]);

  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '28rem', background: 'var(--pharm-card)', borderRadius: 12, padding: '1.5rem' }}>
          <p style={{ margin: 0 }}>{error}</p>
          <p style={{ margin: '1rem 0 0' }}>
            <a href={`${getMainAppUrl()}/login`}>← Вход на aurent.uz</a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <p style={{ color: 'var(--pharm-muted)' }}>Вход в аптеку…</p>
    </main>
  );
}
