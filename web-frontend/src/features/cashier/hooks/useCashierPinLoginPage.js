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
import { normalizePin, PIN_MIN } from '../utils/cashierPinUtils';

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
  const [companyCode, setCompanyCode] = useState('');
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const freshLoginRef = useRef(false);
  const touchLayout = useCashierPosTouchLayout();

  useEffect(() => {
    if (!hasHydrated || !token || !['CASHIER', 'WAITER'].includes(user?.role)) return;
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
      if (window.location.pathname.startsWith('/cashier/login')) {
        navigate('/cashier', { replace: true });
      }
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
    () => normalizePin(pin).length >= PIN_MIN && Boolean(normalizedCompanyCode),
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
    try {
      const res = await authApi.cashierPinLogin({
        companyLoginCode: loginCode,
        pin: normalizePin(pin),
      });
      const { token: accessToken, ...profile } = res.data;
      if (!accessToken) {
        toast.error(t('login.failed'));
        return;
      }
      if (profile.role !== 'CASHIER' && profile.role !== 'WAITER') {
        toast.error(t('login.failed'));
        return;
      }
      const loginCodeFromProfile = normalizeCompanyLoginCode(profile.companyLoginCode);
      setAuth(accessToken, {
        ...profile,
        companyLoginCode: loginCode || loginCodeFromProfile || profile.companyLoginCode,
      });
      if (loginCode) persistCompanyLoginCode(loginCode);
      setCompanyPopoverOpen(false);
      freshLoginRef.current = true;
      navigate('/cashier', { replace: true });
      window.setTimeout(() => {
        freshLoginRef.current = false;
      }, 4000);
    } catch (err) {
      toast.error(resolveAuthErrorMessage(err, t), {
        id: err.response ? 'cashier-login-api' : 'cashier-login-network',
      });
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, loading, normalizedCompanyCode, pin, setAuth, navigate, t]);

  const pressDigit = useCallback((d) => {
    setPin((p) => normalizePin(p + String(d)));
  }, []);

  const backspace = useCallback(() => {
    setPin((p) => normalizePin(p).slice(0, -1));
  }, []);

  const clear = useCallback(() => {
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
  const dotCount = Math.max(PIN_MIN, dots.length);

  return {
    t,
    touchLayout,
    pin,
    dots,
    dotCount,
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
