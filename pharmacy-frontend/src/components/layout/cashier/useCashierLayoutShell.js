import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  cashierThemeClassName,
  clearCashierThemeDocument,
  readCashierTheme,
  syncCashierThemeDocument,
  writeCashierTheme,
} from '../../../utils/cashierTheme';
import { syncRootTheme } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession } from '../../../utils/authSession';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShiftModal } from '../../../contexts/CashierShiftModalContext';
import { useCashierLock } from '../../../contexts/CashierLockContext';
import { clearCashierScreenLocked } from '../../../utils/cashierLock';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { cashierLoginPath } from '../../../utils/authLogin';
import { useCashierShiftView } from '../../../hooks/useCashierShiftView';
import { useCashierTerminalRegistration } from '../../../hooks/useCashierTerminalRegistration';
import { useOfflineConnectivity } from '../../../hooks/useOfflineConnectivity';
import { useCashierPosTouchLayout } from '../../../hooks/useCashierPosTouchLayout';
import { useCashierPosDesktopLayout } from '../../../hooks/useCashierPosDesktopLayout';
import { resetCashierDocumentUiState } from '../../../utils/resetCashierDocumentUiState';
import { syncAuthSession } from '../../../utils/syncAuthSession';
import { isCashierRegisterScreen } from '../../../utils/cashierRegisterRoute';
import { useCashierStoreProfile } from '../../../hooks/useCashierStoreProfile';
import { displayCashierName, formatShiftOpenedAt } from './cashierLayoutUtils';
import { useCashierUiScale } from '../../../features/cashier/hooks/useCashierUiScale';

export function useCashierLayoutShell() {
  const [cashierTheme, setCashierTheme] = useState(readCashierTheme);
  const zoom = useCashierUiScale();

  useLayoutEffect(() => {
    syncCashierThemeDocument(cashierTheme);
    return () => {
      clearCashierThemeDocument();
      syncRootTheme();
    };
  }, [cashierTheme]);

  useEffect(() => {
    resetCashierDocumentUiState();
    return () => resetCashierDocumentUiState();
  }, []);

  useEffect(() => {
    // Токен живёт 24ч; модули — в refresh. Синхронизируем при фокусе и раз в 5 мин.
    syncAuthSession();
    const intervalId = window.setInterval(syncAuthSession, 5 * 60 * 1000);
    const onFocus = () => {
      if (document.visibilityState === 'visible') syncAuthSession();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const toggleCashierTheme = () => {
    setCashierTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      writeCashierTheme(next);
      return next;
    });
  };

  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { storeId, storeName, storeLoading, storeError } = useCashierStore();
  const { open, openShift, closeShift } = useCashierShiftModal();
  const { lock } = useCashierLock();
  const navigate = useNavigate();
  const location = useLocation();
  const isPosRoute = isCashierRegisterScreen(location.pathname);

  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const { isPharmacy } = useCashierStoreProfile();
  const catalogKind = isPharmacy ? 'pharmacy' : 'grocery';
  const { shift, shiftIsOpen } = useCashierShiftView(storeId, { catalogKind });

  const shiftOpenBadge = useMemo(() => {
    if (!shiftIsOpen) return null;
    const time = formatShiftOpenedAt(shift?.openedAt);
    return time ? t('pos.shiftOpenedAt', { time }) : t('pos.shiftOpen');
  }, [shiftIsOpen, shift?.openedAt, t]);

  const cashierRoleLabel = useMemo(() => {
    if (!user?.role) return '';
    return t(`roles.${user.role}`, { defaultValue: user.role });
  }, [t, user?.role]);

  const handleLogout = () => {
    clearCashierScreenLocked(user?.id);
    logoutAndResetSession();
    navigate(cashierLoginPath());
  };

  const themeClass = cashierThemeClassName(cashierTheme);
  const isDesktopApp =
    typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);

  useOfflineConnectivity();
  useCashierTerminalRegistration(storeId);

  useEffect(() => {
    if (!isDesktopApp) return undefined;
    document.documentElement.classList.add('cashier-shell--desktop');
    return () => document.documentElement.classList.remove('cashier-shell--desktop');
  }, [isDesktopApp]);

  const touchLayout = useCashierPosTouchLayout();
  const posDesktop = useCashierPosDesktopLayout();

  const shellClassName = `cashier-app ${themeClass} d-flex cashier-app--bottom-nav${
    isPosRoute ? ' cashier-app--pos-screen' : ''
  }${posDesktop && isPosRoute ? ' cashier-app--pos-desktop' : ''}${
    touchLayout ? ' cashier-app--touch' : ''
  }${isDesktopApp ? ' cashier-app--desktop' : ''}${
    isPharmacy ? ' cashier-app--pharmacy-pos' : ''
  }`;

  return {
    t,
    user,
    storeId,
    storeName,
    storeLoading,
    storeError,
    open,
    openShift,
    closeShift,
    lock,
    isPosRoute,
    displayAppName,
    catalogKind,
    shift,
    shiftIsOpen,
    cashierTheme,
    toggleCashierTheme,
    handleLogout,
    shellClassName,
    isDesktopApp,
    shiftOpenBadge,
    zoom,
    cashierRoleLabel,
    displayCashierName: () => displayCashierName(user),
  };
}
