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
  peekCashierCompanyCode,
  cashierSessionMatchesCompany,
  resolveCashierCompanyCode,
  shouldShowCashierCompanyCodeField,
  isDesktopCashier,
} from '../../../utils/authLogin';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';
import { resolveAuthErrorMessage } from '../../../utils/apiError';
import { resolveAppHomePath } from '../../../utils/appHomePath';
import { fetchRestaurantAppAccess } from '../../../utils/fetchRestaurantAppAccess';
import { logoutAndResetSession, resetClientSessionState } from '../../../utils/authSession';
import { normalizePin, PIN_MAX } from '../utils/cashierPinUtils';

const PIN_ROLES = new Set(['MANAGER', 'CASHIER', 'WAITER', 'COOK']);
const ADMIN_PASSWORD_ROLES = new Set(['ADMIN', 'MANAGER', 'SUPER_ADMIN']);
const ROSTER_CACHE_TTL_MS = 5 * 60 * 1000;

function rosterCacheKey(loginCode) {
  return `rst.pinRoster:${loginCode}`;
}

function readRosterCache(loginCode) {
  try {
    const raw = sessionStorage.getItem(rosterCacheKey(loginCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows)) return null;
    if (Date.now() - Number(parsed.at || 0) > ROSTER_CACHE_TTL_MS) return null;
    return parsed.rows;
  } catch {
    return null;
  }
}

function writeRosterCache(loginCode, rows) {
  try {
    sessionStorage.setItem(rosterCacheKey(loginCode), JSON.stringify({ at: Date.now(), rows }));
  } catch {
    /* ignore */
  }
}

async function resolvePinHomePath(role) {
  // Hall desktop is always the restaurant app — do not kick users for missing local business-types.
  if (isRestaurantDesktop()) {
    return {
      path: resolveAppHomePath(role),
      access: { ok: true },
    };
  }
  const { access, businessPayload, fetchError } = await fetchRestaurantAppAccess(role);
  return {
    path: resolveAppHomePath(role, businessPayload?.defaultTypeCode),
    // Transport/403 on business-types: fail-open (same as RestaurantWorldGate).
    access: fetchError ? { ok: true } : access,
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

  const initialCompanyCode = peekCashierCompanyCode(searchParams);
  const initialRosterCache = initialCompanyCode ? readRosterCache(initialCompanyCode) : null;
  const [step, setStep] = useState('roster');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [roster, setRoster] = useState(() => initialRosterCache ?? []);
  const [rosterLoading, setRosterLoading] = useState(() => (
    Boolean(initialCompanyCode) && initialRosterCache === null
  ));
  const [rosterError, setRosterError] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [companyCode, setCompanyCode] = useState(initialCompanyCode);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const freshLoginRef = useRef(false);
  const rosterReqRef = useRef(0);
  const rosterRef = useRef(roster);
  rosterRef.current = roster;
  const touchLayout = useCashierPosTouchLayout();

  useEffect(() => {
    if (!hasHydrated || !token) return;
    // Fresh password login for admin — let navigate finish; otherwise clear non-PIN sessions.
    if (!PIN_ROLES.has(user?.role)) {
      if (freshLoginRef.current && ADMIN_PASSWORD_ROLES.has(user?.role)) return;
      // Hall desktop: never wipe admin/manager from the PIN screen — send them home.
      if (isRestaurantDesktop() && ADMIN_PASSWORD_ROLES.has(user?.role)) {
        let cancelled = false;
        (async () => {
          const { path } = await resolvePinHomePath(user.role);
          if (!cancelled) navigate(path, { replace: true });
        })();
        return () => { cancelled = true; };
      }
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
      if (!cancelled && code) setCompanyCode((prev) => (prev === code ? prev : code));
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const normalizedCompanyCode = useMemo(
    () => normalizeCompanyLoginCode(companyCode),
    [companyCode]
  );

  // Save as soon as 5 digits are valid — not only after PIN/admin login.
  useEffect(() => {
    if (!normalizedCompanyCode) return;
    persistCompanyLoginCode(normalizedCompanyCode);
  }, [normalizedCompanyCode]);

  const loadRoster = useCallback(async (loginCode, { force = false } = {}) => {
    if (!loginCode) {
      rosterReqRef.current += 1;
      setRoster([]);
      setRosterError('');
      setRosterLoading(false);
      return;
    }
    const reqId = ++rosterReqRef.current;
    const cached = readRosterCache(loginCode);
    if (!force) {
      if (cached !== null) {
        rosterRef.current = cached;
        setRoster(cached);
        setRosterError('');
      } else {
        // Avoid showing another company's cards while the new roster loads.
        rosterRef.current = [];
        setRoster([]);
        setRosterError('');
      }
    }
    setRosterLoading(true);
    try {
      const res = await authApi.cashierPinRoster(loginCode);
      if (reqId !== rosterReqRef.current) return;
      let rows = Array.isArray(res.data) ? res.data : [];
      // Desktop: local DB empty until bootstrap — pull public cloud roster by company code.
      if (
        rows.length === 0
        && isRestaurantDesktop()
        && typeof window.aurentRestaurant?.fetchCloudPinRoster === 'function'
      ) {
        try {
          const cloudRows = await window.aurentRestaurant.fetchCloudPinRoster(loginCode);
          if (Array.isArray(cloudRows) && cloudRows.length) {
            rows = cloudRows;
          }
        } catch {
          /* keep local empty / error below */
        }
      }
      setRoster(rows);
      writeRosterCache(loginCode, rows);
      setRosterError('');
    } catch (err) {
      if (reqId !== rosterReqRef.current) return;
      // Local roster failed — still try cloud on desktop.
      if (isRestaurantDesktop() && typeof window.aurentRestaurant?.fetchCloudPinRoster === 'function') {
        try {
          const cloudRows = await window.aurentRestaurant.fetchCloudPinRoster(loginCode);
          if (reqId !== rosterReqRef.current) return;
          if (Array.isArray(cloudRows) && cloudRows.length) {
            setRoster(cloudRows);
            writeRosterCache(loginCode, cloudRows);
            setRosterError('');
            return;
          }
        } catch {
          /* fall through */
        }
      }
      const msg = resolveAuthErrorMessage(err, t) || t('cashierLogin.rosterFailed', {
        defaultValue: 'Не удалось загрузить сотрудников',
      });
      if (rosterRef.current.length) {
        setRosterError('');
      } else {
        setRoster([]);
        setRosterError(msg);
      }
    } finally {
      if (reqId === rosterReqRef.current) setRosterLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!normalizedCompanyCode) {
      rosterReqRef.current += 1;
      setRoster([]);
      setRosterError('');
      setRosterLoading(false);
      return;
    }
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
      // Restaurant desktop: first online admin login copies staff hashes into local edge DB.
      if (isRestaurantDesktop() && typeof window.aurentRestaurant?.bootstrapStaffFromCloud === 'function') {
        let needsBootstrap = true;
        try {
          const status = await window.aurentRestaurant.getEdgeAuthStatus?.();
          needsBootstrap = !status?.hasStaff || !status?.hasCatalog || !status?.hasStock || !status?.hasStores;
        } catch {
          needsBootstrap = true;
        }
        // Always refresh catalog/stock when online admin logs in on desktop (down-sync).
        if (needsBootstrap || navigator.onLine !== false) {
          toast.loading(t('cashierLogin.edgeBootstrap', {
            defaultValue: 'Копируем сотрудников и каталог с облака…',
          }), { id: 'edge-bootstrap' });
          try {
            await window.aurentRestaurant.bootstrapStaffFromCloud({ username, password });
            toast.success(t('cashierLogin.edgeBootstrapDone', {
              defaultValue: 'Локальные сотрудники и каталог готовы',
            }), { id: 'edge-bootstrap' });
          } catch (bootErr) {
            toast.dismiss('edge-bootstrap');
            if (needsBootstrap) throw bootErr;
            // Soft: local already has data; cloud refresh failed
            toast.error(bootErr?.message || t('cashierLogin.edgeBootstrapPartial', {
              defaultValue: 'Облако недоступно — работаем с локальной копией',
            }));
          }
        }
      }

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
      freshLoginRef.current = true;
      setAuth(accessToken, profile);
      if (normalizedCompanyCode) persistCompanyLoginCode(normalizedCompanyCode);

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
      const apiMsg = err.response?.data?.message || err.message;
      if (apiMsg && /invalid credentials|invalid username or password|неверн/i.test(String(apiMsg))) {
        setAdminError(t('login.badCredentials'));
      } else if (err.response) {
        setAdminError(resolveAuthErrorMessage(err, t) || t('login.failed'));
      } else {
        // Electron bootstrap throws plain Error (no axios response) — show real text.
        setAdminError(apiMsg || t('login.networkError'));
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
      const pinNorm = normalizePin(pin);
      let authPayload = null;

      // Desktop: verify PIN on cloud, upsert local hash, get local JWT (works before admin bootstrap).
      if (
        isRestaurantDesktop()
        && typeof window.aurentRestaurant?.ensureStaffViaCloudPin === 'function'
        && navigator.onLine !== false
      ) {
        try {
          authPayload = await window.aurentRestaurant.ensureStaffViaCloudPin({
            companyLoginCode: loginCode,
            pin: pinNorm,
            userId: selectedStaff.id,
          });
        } catch (cloudPinErr) {
          // Fall back to local-only if already bootstrapped / offline cloud error.
          console.warn('[edge] cloud pin ensure failed', cloudPinErr?.message || cloudPinErr);
        }
      }

      if (!authPayload?.token) {
        const res = await authApi.cashierPinLogin({
          companyLoginCode: loginCode,
          pin: pinNorm,
          userId: selectedStaff.id,
        });
        authPayload = res.data;
      }

      const { token: accessToken, ...profile } = authPayload || {};
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
    reloadRoster: () => loadRoster(normalizedCompanyCode, { force: true }),
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
    showCompanyCodeField: shouldShowCashierCompanyCodeField(companyCode),
    pressDigit,
    backspace,
    clear,
    submit,
    toggleFullscreen,
    quitApp,
    showQuit: isDesktopCashier() && typeof window.desktopCashier?.quit === 'function',
  };
}
