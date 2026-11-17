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

const exchangePromises = new Map();

function exchangeHandoffOnce(code) {
  let promise = exchangePromises.get(code);
  if (!promise) {
    promise = authApi.exchangeHandoff(code).finally(() => {
      setTimeout(() => exchangePromises.delete(code), 10_000);
    });
    exchangePromises.set(code, promise);
  }
  return promise;
}

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
        const { data } = await exchangeHandoffOnce(code);
        if (cancelled) return;
        const user = mapAuthResponseToUser(data);
        setAuth(data.token, user);
        const requested = safePharmacyNextPath(searchParams.get('next'));
        const role = String(user?.role || '').toUpperCase();
        const office = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT';
        const next = office
          ? (requested && !requested.startsWith('/pos') ? requested : '/dashboard')
          : (requested || PHARM_POS_PATH);
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
      <main className="grid min-h-screen place-items-center bg-canvas p-8">
        <div className="ui-card-padded w-full max-w-md space-y-4">
          <div className="ui-alert-danger">{error}</div>
          <p className="text-sm">
            <a href={`${getMainAppUrl()}/login`} className="font-medium text-primary-600 hover:underline">
              ← Вход на aurent.uz
            </a>
          </p>
        </div>
      </main>
    );
  }

  return null;
}
