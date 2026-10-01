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
  isDesktopCashier,
} from '../../../utils/authLogin';
import { resolveAuthErrorMessage } from '../../../utils/apiError';
import { resolveAppHomePath } from '../../../utils/appHomePath';
import { fetchRestaurantAppAccess } from '../../../utils/fetchRestaurantAppAccess';
import { logoutAndResetSession, resetClientSessionState } from '../../../utils/authSession';
import { normalizePin, PIN_MAX } from '../utils/cashierPinUtils';

const PIN_ROLES = new Set(['MANAGER', 'CASHIER', 'WAITER', 'COOK']);
const ADMIN_PASSWORD_ROLES = new Set(['ADMIN', 'MANAGER', 'SUPER_ADMIN']);

async function resolvePinHomePath(role) {
  const { access, businessPayload, fetchError } = await fetchRestaurantAppAccess(role);
  return {
    path: resolveAppHomePath(role, businessPayload?.defaultTypeCode),
    // Transport/403 on business-types: fail-open (same as RestaurantWorldGate).
    access: fetchError ? { ok: true } : access,
  };
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
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

  const [step, setStep] = useState('roster');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const freshLoginRef = useRef(false);
  const touchLayout = useCashierPosTouchLayout();
  const now = useClock();

  useEffect(() => {
    if (!hasHydrated || !token) return;
    // Fresh password login for admin — let navigate finish; otherwise clear non-PIN sessions.
    if (!PIN_ROLES.has(user?.role)) {
      if (freshLoginRef.current && ADMIN_PASSWORD_ROLES.has(user?.role)) return;
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

  const loadRoster = useCallback(async (loginCode) => {
    if (!loginCode) {
      setRoster([]);
      setRosterError('');
      return;
    }
    setRosterLoading(true);
    setRosterError('');
    try {
      const res = await authApi.cashierPinRoster(loginCode);
      setRoster(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setRoster([]);
      setRosterError(resolveAuthErrorMessage(err, t) || t('cashierLogin.rosterFailed', {
        defaultValue: 'Не удалось загрузить сотрудников',
      }));
    } finally {
      setRosterLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!normalizedCompanyCode) return;
    loadRoster(normalizedCompanyCode);
  }, [normalizedCompanyCode, loadRoster]);

  const selectStaff = useCallback((staff) => {
    setSelectedStaff(staff);
    setPin('');
    setPinError('');
    setStep('pin');
  }, []);

  const openAdminLogin = useCallback(() => {
    setSelectedStaff(null);
    setPin('');
    setPinError('');
    setAdminError('');
    setAdminPassword('');
    setStep('admin');
  }, []);

  const backToRoster = useCallback(() => {
    setStep('roster');
    setSelectedStaff(null);
    setPin('');
    setPinError('');
    setAdminError('');
    setAdminPassword('');
  }, []);

  const submitAdmin = useCallback(async () => {
    if (loading) return;
    const username = String(adminUsername || '').trim();
    const password = String(adminPassword || '');
    if (!username || !password) {
      setAdminError(t('validation.required', { defaultValue: 'Обязательное поле' }));
      return;
    }
    setLoading(true);
    setAdminError('');
    try {
      const res = await authApi.login({
        username,
        password,
        companyLoginCode: normalizedCompanyCode || undefined,
      });
      const { token: accessToken, ...profile } = res.data;
      if (!accessToken) {
        setAdminError(t('login.failed'));
        return;
      }
      if (!ADMIN_PASSWORD_ROLES.has(profile.role)) {
        setAdminError(t('cashierLogin.adminRoleOnly', {
          defaultValue: 'Этот вход только для администратора или менеджера',
        }));
        return;
      }
      resetClientSessionState();
      setAuth(accessToken, profile);
      if (normalizedCompanyCode) persistCompanyLoginCode(normalizedCompanyCode);
      freshLoginRef.current = true;

      const { path, access } = await resolvePinHomePath(profile.role);
      if (!access.ok) {
        logoutAndResetSession();
        setAdminError(t('login.wrongAppUnknown'));
        freshLoginRef.current = false;
        return;
      }
      toast.success(t('login.welcome', { name: profile.fullName || profile.username }));
      navigate(path, { replace: true });
      window.setTimeout(() => {
        freshLoginRef.current = false;
      }, 4000);
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      if (!err.response) {
        setAdminError(t('login.networkError'));
      } else if (apiMsg === 'Invalid username or password') {
        setAdminError(t('login.badCredentials'));
      } else {
        setAdminError(resolveAuthErrorMessage(err, t) || t('login.failed'));
      }
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    adminUsername,
    adminPassword,
    normalizedCompanyCode,
    setAuth,
    navigate,
    t,
  ]);

  const canSubmit = useMemo(
    () => Boolean(selectedStaff?.id)
      && normalizePin(pin).length === PIN_MAX
      && Boolean(normalizedCompanyCode),
    [selectedStaff, pin, normalizedCompanyCode]
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
        userId: selectedStaff.id,
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
  }, [canSubmit, loading, normalizedCompanyCode, pin, selectedStaff, setAuth, navigate, t]);

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
    if (step !== 'pin') return undefined;
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
      if (e.key === 'Escape') {
        backToRoster();
        return;
      }
      if (e.key === 'Enter') {
        submit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, loading, pressDigit, backspace, submit, backToRoster]);

  const toggleFullscreen = useCallback(() => {
    if (typeof window.desktopCashier?.toggleFullscreen === 'function') {
      window.desktopCashier.toggleFullscreen();
      return;
    }
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const quitApp = useCallback(() => {
    if (typeof window.desktopCashier?.quit === 'function') {
      window.desktopCashier.quit();
    }
  }, []);

  const dots = normalizePin(pin);
  const dotCount = PIN_MAX;
  const pinFull = dots.length >= PIN_MAX;

  const clockLabel = useMemo(() => {
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }, [now]);

  const dateLabel = useMemo(() => {
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }, [now]);

  return {
    t,
    touchLayout,
    step,
    roster,
    rosterLoading,
    rosterError,
    selectedStaff,
    selectStaff,
    openAdminLogin,
    backToRoster,
    reloadRoster: () => loadRoster(normalizedCompanyCode),
    pin,
    dots,
    dotCount,
    pinError,
    pinFull,
    loading,
    canSubmit,
    adminUsername,
    setAdminUsername,
    adminPassword,
    setAdminPassword,
    adminError,
    showAdminPass,
    toggleAdminPass: () => setShowAdminPass((v) => !v),
    submitAdmin,
    companyCode,
    setCompanyCode,
    companyPopoverOpen,
    setCompanyPopoverOpen,
    showCompanyCodeField: shouldShowCashierCompanyCodeField(),
    pressDigit,
    backspace,
    clear,
    submit,
    clockLabel,
    dateLabel,
    toggleFullscreen,
    quitApp,
    showQuit: isDesktopCashier() && typeof window.desktopCashier?.quit === 'function',
  };
}
