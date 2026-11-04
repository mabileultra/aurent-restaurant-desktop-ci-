import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  cashierThemeClassName,
  clearCashierThemeDocument,
  readCashierTheme,
  syncCashierThemeDocument,
  writeCashierTheme,
} from '../../utils/cashierTheme';
import { syncRootTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { useCashierStore } from '../../hooks/useCashierStore';
import { useCashierShiftModal } from '../../contexts/CashierShiftModalContext';
import { clearCashierScreenLocked } from '../../utils/cashierLock';
import { useCashierShiftView } from '../../hooks/useCashierShiftView';
import { useCashierTerminalRegistration } from '../../hooks/useCashierTerminalRegistration';
import { useOfflineConnectivity } from '../../hooks/useOfflineConnectivity';
import { useCashierPosTouchLayout } from '../../hooks/useCashierPosTouchLayout';
import { useCashierPosDesktopLayout } from '../../hooks/useCashierPosDesktopLayout';
import { resetCashierDocumentUiState } from '../../utils/resetCashierDocumentUiState';
import { syncAuthSession } from '../../utils/syncAuthSession';
import { displayCashierName, formatShiftOpenedAt } from '../../components/layout/cashier/cashierLayoutUtils';
import { useCashierUiScale } from '../../features/cashier/hooks/useCashierUiScale';
import { PHARMACY_CATALOG_KIND } from '../config/vertical';

const CATALOG_KIND = PHARMACY_CATALOG_KIND;

/**
 * Pharmacy POS chrome state — always pharmacy catalog, login stays on this SPA.
 * Not a fork of grocery secondary routes / bottom-nav world.
 */
export function usePharmacyPosShell() {
  const [cashierTheme, setCashierTheme] = useState(readCashierTheme);
  const zoom = useCashierUiScale();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { storeId, storeName } = useCashierStore();
  const { open, openShift, closeShift } = useCashierShiftModal();
  const navigate = useNavigate();
  const { shift, shiftIsOpen } = useCashierShiftView(storeId, { catalogKind: CATALOG_KIND });

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

  useOfflineConnectivity();
  useCashierTerminalRegistration(storeId);

  const isDesktopApp =
    typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);

  useEffect(() => {
    if (!isDesktopApp) return undefined;
    document.documentElement.classList.add('cashier-shell--desktop');
    return () => document.documentElement.classList.remove('cashier-shell--desktop');
  }, [isDesktopApp]);

  const touchLayout = useCashierPosTouchLayout();
  const posDesktop = useCashierPosDesktopLayout();

  const shiftOpenBadge = useMemo(() => {
    if (!shiftIsOpen) return null;
    const time = formatShiftOpenedAt(shift?.openedAt);
    return time ? t('pos.shiftOpenedAt', { time }) : t('pos.shiftOpen');
  }, [shiftIsOpen, shift?.openedAt, t]);

  const cashierRoleLabel = useMemo(() => {
    if (!user?.role) return '';
    return t(`roles.${user.role}`, { defaultValue: user.role });
  }, [t, user?.role]);

  const toggleCashierTheme = () => {
    setCashierTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      writeCashierTheme(next);
      return next;
    });
  };

  const handleLogout = () => {
    clearCashierScreenLocked(user?.id);
    logoutAndResetSession();
    navigate('/login', { replace: true });
  };

  const themeClass = cashierThemeClassName(cashierTheme);
  const shellClassName = [
    'cashier-app',
    'pharmacy-pos-shell',
    themeClass,
    'd-flex',
    'cashier-app--pos-screen',
    'cashier-app--pharmacy-pos',
    posDesktop ? 'cashier-app--pos-desktop' : '',
    touchLayout ? 'cashier-app--touch' : '',
    isDesktopApp ? 'cashier-app--desktop' : '',
  ].filter(Boolean).join(' ');

  return {
    t,
    storeId,
    storeName,
    open,
    openShift,
    closeShift,
    catalogKind: CATALOG_KIND,
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
