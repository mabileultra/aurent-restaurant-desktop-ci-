import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useCashierPosTouchLayout } from '../../../hooks/useCashierPosTouchLayout';
import {
  normalizeCompanyLoginCode,
  persistCompanyLoginCode,
  cashierSessionMatchesCompany,
  resolveCashierCompanyCode,
  shouldShowCashierCompanyCodeField,
} from '../../../utils/authLogin';
import { resolveAuthErrorMessage } from '../../../utils/apiError';
import { resolveAppHomePath } from '../../../utils/appHomePath';
import { fetchRestaurantAppAccess } from '../../../utils/fetchRestaurantAppAccess';
import { logoutAndResetSession } from '../../../utils/authSession';
import { normalizePin, PIN_MAX } from '../utils/cashierPinUtils';

const PIN_ROLES = new Set(['CASHIER', 'WAITER', 'COOK']);

async function resolvePinHomePath(role) {
  const { access, businessPayload } = await fetchRestaurantAppAccess(role);
  return {
    path: resolveAppHomePath(role, businessPayload?.defaultTypeCode),
    access,
  };
}

export function useCashierPinLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const freshLoginRef = useRef(false);
  const touchLayout = useCashierPosTouchLayout();

  useEffect(() => {
    if (!hasHydrated || !token) return;
    // Сессия админа/пароля на PIN-экране — сбрасываем, иначе PWA «прыгает» в админку.
    if (!PIN_ROLES.has(user?.role)) {
      logoutAndResetSession();
      return;
    }
    if (freshLoginRef.current) return;

    let cancelled = false;
    (async () => {
      const expectedCode = await resolveCashierCompanyCode(searchParams);
      if (cancelled || freshLoginRef.current) return;
      if (!cashierSessionMatchesCompany(user, expectedCode)) {
        logout();
        setPin('');
        toast.error(t('cashierLogin.companyChanged', {
          defaultValue: 'Код компании изменён — войдите с PIN снова',
        }));
        return;
      }
      if (!window.location.pathname.startsWith('/cashier/login')) return;

      const { path, access } = await resolvePinHomePath(user.role);
      if (cancelled || freshLoginRef.current) return;
      if (!access.ok) {
        logoutAndResetSession();
        toast.error(t('login.wrongAppUnknown'));
        return;
      }
      navigate(path, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, token, user, navigate, logout, searchParams, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const code = await resolveCashierCompanyCode(searchParams);
      if (!cancelled && code) setCompanyCode(code);
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const normalizedCompanyCode = useMemo(
    () => normalizeCompanyLoginCode(companyCode),
    [companyCode]
  );

  const canSubmit = useMemo(
    () => normalizePin(pin).length === PIN_MAX && Boolean(normalizedCompanyCode),
    [pin, normalizedCompanyCode]
  );

  const submit = useCallback(async () => {
    if (!canSubmit || loading) return;
    const loginCode = normalizedCompanyCode;
    if (!loginCode) {
      if (shouldShowCashierCompanyCodeField()) setCompanyPopoverOpen(true);
      toast.error(t('cashierLogin.companyCodeRequired', { defaultValue: 'Укажите код компании' }));
      return;
    }
    setLoading(true);
    setPinError('');
    try {
      const res = await authApi.cashierPinLogin({
        companyLoginCode: loginCode,
        pin: normalizePin(pin),
      });
      const { token: accessToken, ...profile } = res.data;
      if (!accessToken) {
        setPinError(t('login.failed'));
        return;
      }
      if (!PIN_ROLES.has(profile.role)) {
        setPinError(t('login.failed'));
        return;
      }
      const loginCodeFromProfile = normalizeCompanyLoginCode(profile.companyLoginCode);
      const sessionUser = {
        ...profile,
        companyLoginCode: loginCode || loginCodeFromProfile || profile.companyLoginCode,
      };
      setAuth(accessToken, sessionUser);
      if (loginCode) persistCompanyLoginCode(loginCode);
      setCompanyPopoverOpen(false);
      freshLoginRef.current = true;

      const { path, access } = await resolvePinHomePath(profile.role);
      if (!access.ok) {
        logoutAndResetSession();
        setPinError(t('login.wrongAppUnknown'));
        freshLoginRef.current = false;
        return;
      }
      navigate(path, { replace: true });
      window.setTimeout(() => {
        freshLoginRef.current = false;
      }, 4000);
    } catch (err) {
      const message = resolveAuthErrorMessage(err, t);
      setPinError(message || t('login.badPin', { defaultValue: 'Неверный PIN' }));
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, loading, normalizedCompanyCode, pin, setAuth, navigate, t]);

  const pressDigit = useCallback((d) => {
    setPinError('');
    setPin((p) => {
      const current = normalizePin(p);
      if (current.length >= PIN_MAX) return current;
      return normalizePin(current + String(d));
    });
  }, []);

  const backspace = useCallback(() => {
    setPinError('');
    setPin((p) => normalizePin(p).slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    setPinError('');
    setPin('');
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (loading) return;
      const target = e.target;
      if (
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target?.isContentEditable
      ) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        pressDigit(e.key);
        return;
      }
      if (e.key === 'Backspace') {
        backspace();
        return;
      }
      if (e.key === 'Enter') {
        submit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loading, pressDigit, backspace, submit]);

  const dots = normalizePin(pin);
  const dotCount = PIN_MAX;
  const pinFull = dots.length >= PIN_MAX;

  return {
    t,
    touchLayout,
    pin,
    dots,
    dotCount,
    pinError,
    pinFull,
    loading,
    canSubmit,
    companyCode,
    setCompanyCode,
    companyPopoverOpen,
    setCompanyPopoverOpen,
    showCompanyCodeField: shouldShowCashierCompanyCodeField(),
    pressDigit,
    backspace,
    clear,
    submit,
  };
}
