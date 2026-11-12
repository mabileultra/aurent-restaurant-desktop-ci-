import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession, resetClientSessionState } from '../../../utils/authSession';
import { resolveAuthErrorMessage } from '../../../utils/apiError';
import { isDesktopCashier, cashierLoginPath } from '../../../utils/authLogin';
import { resolveAppHomePath } from '../../../utils/appHomePath';
import { fetchMainAppAccess } from '../../../utils/fetchMainAppAccess';
import { prefetchAppHome } from '../../../utils/prefetchAppHome';
import { companyUsesPharmacyOffice } from '../../../utils/isPharmacyOnlyCompany';
import { isPharmacyAppSplitEnabled } from '../../../config/pharmacyAppUrl';
import { redirectToPharmacyApp } from '../../../utils/redirectToPharmacyApp';

async function resolvePostLoginPath(role, businessPayload) {
  const path = resolveAppHomePath(role, businessPayload?.defaultTypeCode);
  // Кассир аптеки на старом desktop остаётся на aurent (force-update).
  if (String(role || '').toUpperCase() === 'CASHIER') return path;
  if (isPharmacyAppSplitEnabled() && companyUsesPharmacyOffice(businessPayload)) {
    const target = path.startsWith('/cashier') ? '/dashboard' : path;
    if (await redirectToPharmacyApp(target)) return null;
    throw new Error('pharmacy-handoff');
  }
  return path;
}

export function useLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const loginInFlightRef = useRef(false);

  const isDesktop = Boolean(window.desktopCashier?.isDesktop);
  const isAdminLogin = searchParams.get('admin') === '1';
  const shouldRedirectToCashierLogin = isDesktopCashier() && !isAdminLogin;

  useEffect(() => {
    if (!hasHydrated || !token || loginInFlightRef.current) return;
    let cancelled = false;
    (async () => {
      const { access, businessPayload, fetchError } = await fetchMainAppAccess(user?.role);
      if (cancelled) return;
      if (!access.ok && !fetchError) {
        logoutAndResetSession();
        return;
      }
      const path = await resolvePostLoginPath(user?.role, businessPayload);
      if (cancelled || !path) return;
      prefetchAppHome(path);
      navigate(path, { replace: true });
    })();
    return () => { cancelled = true; };
  }, [hasHydrated, token, user, navigate]);

  const schema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t('validation.required')),
        password: z.string().min(1, t('validation.required')),
        remember: z.boolean().optional(),
      }),
    [t]
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '', remember: false },
  });

  const finishLogin = async (accessToken, profile) => {
    loginInFlightRef.current = true;
    let left = false;
    try {
      resetClientSessionState();
      setAuth(accessToken, profile);
      const { access, businessPayload, fetchError } = await fetchMainAppAccess(profile.role);
      if (!access.ok && !fetchError) {
        logoutAndResetSession();
        toast.error(t('login.wrongAppUnknown'));
        return false;
      }
      const path = await resolvePostLoginPath(profile.role, businessPayload);
      if (!path) {
        left = true;
        return true;
      }
      toast.success(t('login.welcome', { name: profile.fullName }));
      prefetchAppHome(path);
      navigate(path, { replace: true });
      return false;
    } finally {
      if (!left) loginInFlightRef.current = false;
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    let left = false;
    try {
      const res = await authApi.login({
        username: data.username,
        password: data.password,
      });
      if (res.data?.requiresTwoFactor && res.data?.challengeToken) {
        setTwoFactorChallenge(res.data.challengeToken);
        setTwoFactorCode('');
        toast(t('login.twoFactorRequired', 'Authenticator kodini kiriting'));
        return;
      }
      const { token: accessToken, ...profile } = res.data;
      if (!accessToken) {
        toast.error(t('login.failed'));
        return;
      }
      left = Boolean(await finishLogin(accessToken, profile));
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      if (!err.response) {
        toast.error(t('login.networkError'), { id: 'login-network-error' });
      } else if (apiMsg === 'Invalid username or password') {
        toast.error(t('login.badCredentials'));
      } else {
        toast.error(resolveAuthErrorMessage(err, t));
      }
    } finally {
      if (!left) setLoading(false);
    }
  };

  const onVerifyTwoFactor = async (event) => {
    event?.preventDefault?.();
    if (!twoFactorChallenge || twoFactorCode.trim().length < 6) {
      toast.error(t('login.twoFactorInvalid', '6 xonali kodni kiriting'));
      return;
    }
    setLoading(true);
    let left = false;
    try {
      const res = await authApi.verifyTwoFactor({
        challengeToken: twoFactorChallenge,
        code: twoFactorCode.trim(),
      });
      const { token: accessToken, ...profile } = res.data;
      if (!accessToken) {
        toast.error(t('login.failed'));
        return;
      }
      setTwoFactorChallenge(null);
      left = Boolean(await finishLogin(accessToken, profile));
    } catch (err) {
      toast.error(resolveAuthErrorMessage(err, t));
    } finally {
      if (!left) setLoading(false);
    }
  };

  return {
    t,
    isDesktop,
    cashierLoginPath,
    shouldRedirectToCashierLogin,
    showPass,
    toggleShowPass: () => setShowPass((v) => !v),
    loading,
    form,
    onSubmit: form.handleSubmit(onSubmit),
    twoFactorChallenge,
    twoFactorCode,
    setTwoFactorCode,
    onVerifyTwoFactor,
    cancelTwoFactor: () => {
      setTwoFactorChallenge(null);
      setTwoFactorCode('');
    },
  };
}
