import { useEffect, useMemo, useState } from 'react';
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

async function resolvePostLoginPath(role, businessPayload) {
  return resolveAppHomePath(role, businessPayload?.defaultTypeCode);
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

  const isDesktop = Boolean(window.desktopCashier?.isDesktop);
  const isAdminLogin = searchParams.get('admin') === '1';
  const shouldRedirectToCashierLogin = isDesktopCashier() && !isAdminLogin;

  useEffect(() => {
    if (!hasHydrated || !token) return;
    let cancelled = false;
    (async () => {
      const { access, businessPayload, fetchError } = await fetchMainAppAccess(user?.role);
      if (cancelled) return;
      if (!access.ok && !fetchError) {
        logoutAndResetSession();
        return;
      }
      const path = await resolvePostLoginPath(user?.role, businessPayload);
      if (cancelled) return;
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

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login({
        username: data.username,
        password: data.password,
      });
      const { token: accessToken, ...profile } = res.data;
      if (!accessToken) {
        toast.error(t('login.failed'));
        return;
      }
      resetClientSessionState();
      setAuth(accessToken, profile);

      const { access, businessPayload, fetchError } = await fetchMainAppAccess(profile.role);
      if (!access.ok && !fetchError) {
        logoutAndResetSession();
        toast.error(t('login.wrongAppUnknown'));
        return;
      }

      toast.success(t('login.welcome', { name: profile.fullName }));
      const path = await resolvePostLoginPath(profile.role, businessPayload);
      prefetchAppHome(path);
      navigate(path, { replace: true });
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
      setLoading(false);
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
  };
}
