import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession, resetClientSessionState } from '../../../utils/authSession';
import { resolveAppHomePath } from '../../../utils/appHomePath';
import { fetchMainAppAccess } from '../../../utils/fetchMainAppAccess';
import {
  readHandoffFromHash,
  clearHandoffHash,
  safeNextPath,
} from '../../../utils/sessionHandoff';
import '../../../styles/auth/auth-accept.css';

/** Accept session handoff from restaurant SPA (or reverse). */
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
        setError('Нет сессии для входа.');
        return;
      }
      resetClientSessionState();
      setAuth(handoff.token, handoff.user || { role: 'ADMIN' });

      const { access, businessPayload } = await fetchMainAppAccess(handoff.user?.role);
      if (!access.ok) {
        logoutAndResetSession();
        setError('Нет такого аккаунта');
        return;
      }

      const next = safeNextPath(searchParams.get('next'));
      let path = next || resolveAppHomePath(handoff.user?.role, businessPayload?.defaultTypeCode);
      // Retired /rst targets must not open main shell — fall back to dashboard.
      if (String(path).startsWith('/rst')) path = '/dashboard';
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

  return <div className="auth-accept">Переход…</div>;
}
