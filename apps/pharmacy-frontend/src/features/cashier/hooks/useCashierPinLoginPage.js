import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../../api';
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
import { isApiUnreachableError } from '../../../utils/apiNetworkError';
import { logoutAndResetSession } from '../../../utils/authSession';
import { syncCashierDocumentPaint } from '../../../utils/cashierDocumentPaint';
import { mapAuthResponseToUser } from '../../auth/utils/mapAuthResponseToUser';
import { PHARM_POS_PATH } from '../../../pharmacy/app/pharmacyPaths';
import { normalizePin, PIN_MAX } from '../utils/cashierPinUtils';
import {
  rememberPharmacyOfflinePinAuth,
  tryPharmacyOfflinePinLogin,
} from '../utils/pharmacyOfflinePinAuth';
import { logAuth } from '../../../services/desktop/activityLog';

/**
 * Pharmacy PIN login on /login — after success go to /pos (no grocery access gate).
 */
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

  useLayoutEffect(() => {
    syncCashierDocumentPaint('pinLogin');
  }, []);

  useEffect(() => {
    if (!hasHydrated || !token || user?.role !== 'CASHIER') return;
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
      navigate(PHARM_POS_PATH, { replace: true });
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
    [companyCode],
  );

  const canSubmit = useMemo(
    () => normalizePin(pin).length === PIN_MAX && Boolean(normalizedCompanyCode),
    [pin, normalizedCompanyCode],
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
      const data = res.data || {};
      const accessToken = data.token;
      if (!accessToken) {
        setPinError(t('login.failed'));
        return;
      }
      const profile = mapAuthResponseToUser(data);
      if (profile.role !== 'CASHIER') {
        logoutAndResetSession();
        setPinError(t('login.failed'));
        return;
      }
      const loginCodeFromProfile = normalizeCompanyLoginCode(profile.companyLoginCode);
      const sessionUser = {
        ...profile,
        companyLoginCode: loginCode || loginCodeFromProfile || profile.companyLoginCode,
      };
      setAuth(accessToken, sessionUser);
      await rememberPharmacyOfflinePinAuth({
        companyLoginCode: loginCode,
        pin: normalizePin(pin),
        token: accessToken,
        user: sessionUser,
      });
      logAuth('Вход по PIN', {
        role: profile.role,
        companyLoginCode: loginCode,
        userId: profile.id,
      });
      if (loginCode) persistCompanyLoginCode(loginCode);
      setCompanyPopoverOpen(false);
      freshLoginRef.current = true;
      navigate(PHARM_POS_PATH, { replace: true });
      window.setTimeout(() => {
        freshLoginRef.current = false;
      }, 4000);
    } catch (err) {
      if (isApiUnreachableError(err)) {
        const offline = await tryPharmacyOfflinePinLogin({
          companyLoginCode: loginCode,
          pin: normalizePin(pin),
        });
        if (offline) {
          setAuth(offline.token, offline.user);
          logAuth('Вход по PIN (офлайн)', {
            role: offline.user?.role,
            companyLoginCode: loginCode,
            userId: offline.user?.id,
          });
          if (loginCode) persistCompanyLoginCode(loginCode);
          setCompanyPopoverOpen(false);
          freshLoginRef.current = true;
          navigate(PHARM_POS_PATH, { replace: true });
          window.setTimeout(() => {
            freshLoginRef.current = false;
          }, 4000);
          return;
        }
      }
      logAuth(
        `Ошибка входа PIN: ${err?.response?.status || err?.message || 'fail'}`,
        { companyLoginCode: loginCode },
        'error',
      );
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

  return {
    t,
    touchLayout,
    pin,
    dots,
    dotCount: PIN_MAX,
    pinError,
    pinFull: dots.length >= PIN_MAX,
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
