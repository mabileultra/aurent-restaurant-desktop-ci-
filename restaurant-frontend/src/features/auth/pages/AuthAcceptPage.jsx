import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession, resetClientSessionState } from '../../../utils/authSession';
import { resolveAppHomePath } from '../../../utils/appHomePath';
import {
  readHandoffFromHash,
  clearHandoffHash,
  safeRestaurantNextPath,
} from '../../../utils/sessionHandoff';
import { fetchRestaurantAppAccess } from '../../../utils/fetchRestaurantAppAccess';
import '../../../styles/auth/auth-accept.css';

/** Accepts session handoff from aurent (or localhost:5173) via URL hash. */
export default function AuthAcceptPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const handoff = readHandoffFromHash();
      clearHandoffHash();
      if (!handoff?.token) {
        setError('Нет сессии для входа. Откройте логин.');
        return;
      }
      resetClientSessionState();
      setAuth(handoff.token, handoff.user || { role: 'ADMIN' });

      const { access, businessPayload } = await fetchRestaurantAppAccess(handoff.user?.role);
      if (!access.ok) {
        logoutAndResetSession();
        setError('Нет такого аккаунта');
        return;
      }

      const next = safeRestaurantNextPath(searchParams.get('next'));
      const path = next || resolveAppHomePath(handoff.user?.role, businessPayload?.defaultTypeCode);
      if (!cancelled) navigate(path, { replace: true });
    })();
    return () => { cancelled = true; };
  }, [navigate, setAuth, searchParams]);

  if (error) {
    return (
      <div className="auth-accept auth-accept__error">
        <p>{error}</p>
        <a href="/login">Войти</a>
      </div>
    );
  }

  return <div className="auth-accept">Вход в ресторан…</div>;
}
