import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { logoutAndResetSession } from '../../utils/authSession';
import { syncAuthSession } from '../../utils/syncAuthSession';
import { syncRootTheme } from '../../store/themeStore';
import { VIEWPORT_MEDIA } from '../../utils/viewportBreakpoints';
import {
  PHARM_FINANCE_CHILDREN,
  PHARM_REGISTER_CHILDREN,
  PHARM_REPORT_SALES_CHILDREN,
  PHARM_REPORT_STOCK_CHILDREN,
  PHARM_REST_NAV,
  PHARM_SALES_CHILDREN,
  PHARM_STOCK_CHILDREN,
  PHARM_USER_CHILDREN,
  pathStarts,
} from './pharmacyAdminNavConfig';

export function usePharmacyAdminShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { hasModule } = useModuleAccess();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(VIEWPORT_MEDIA.desktop).matches
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(VIEWPORT_MEDIA.desktop).matches
  );
  const [sidebarNavExpanded, setSidebarNavExpanded] = useState(true);
  const [stockOpen, setStockOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reportsSalesOpen, setReportsSalesOpen] = useState(false);
  const [reportsStockOpen, setReportsStockOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [registersOpen, setRegistersOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);

  useEffect(() => {
    syncRootTheme();
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

  useEffect(() => {
    const mq = window.matchMedia(VIEWPORT_MEDIA.desktop);
    const syncViewport = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      if (desktop) setMobileNavOpen(false);
      else {
        setSidebarOpen(false);
        setSidebarNavExpanded(true);
      }
    };
    syncViewport();
    mq.addEventListener('change', syncViewport);
    return () => mq.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => setMobileNavOpen(false), [location.pathname]);

  const path = location.pathname;
  useEffect(() => {
    if (pathStarts(path, '/stock')) setStockOpen(true);
    if (pathStarts(path, '/sales') || pathStarts(path, '/returns')) setSalesOpen(true);
    if (pathStarts(path, '/reports')) setReportsOpen(true);
    if (pathStarts(path, '/reports/sales') || pathStarts(path, '/reports/analytics')
      || pathStarts(path, '/reports/returns') || pathStarts(path, '/reports/sync')
      || path === '/reports') {
      setReportsSalesOpen(true);
    }
    if (pathStarts(path, '/reports/stock') || path === '/reports') setReportsStockOpen(true);
    if (pathStarts(path, '/finance')) setFinanceOpen(true);
    if (pathStarts(path, '/cash-registers')) setRegistersOpen(true);
    if (pathStarts(path, '/users')) setUsersOpen(true);
  }, [path]);

  const filterByModule = (items) => items.filter((item) => !item.moduleId || hasModule(item.moduleId));
  const stockNav = filterByModule(PHARM_STOCK_CHILDREN);
  const salesNav = PHARM_SALES_CHILDREN;
  const financeNav = filterByModule(PHARM_FINANCE_CHILDREN);
  const registersNav = filterByModule(PHARM_REGISTER_CHILDREN);
  const reportsSalesNav = filterByModule(PHARM_REPORT_SALES_CHILDREN);
  const reportsStockNav = filterByModule(PHARM_REPORT_STOCK_CHILDREN);
  const usersNav = filterByModule(PHARM_USER_CHILDREN);
  const visibleRest = filterByModule(PHARM_REST_NAV).filter(
    (item) => item.to !== '/billing' || user?.role === 'ADMIN'
  );

  const handleLogout = () => {
    logoutAndResetSession();
    navigate('/login');
  };
  const navLabelsVisible = isDesktop ? sidebarNavExpanded : true;
  const toggleSidebar = () => {
    if (!isDesktop) return setMobileNavOpen((open) => !open);
    if (sidebarOpen) {
      setSidebarNavExpanded(false);
      return setSidebarOpen(false);
    }
    setSidebarOpen(true);
  };
  const onSidebarTransitionEnd = (e) => {
    if (e.propertyName === 'width') setSidebarNavExpanded(sidebarOpen);
  };

  return {
    t,
    user,
    roleLabel: user?.role ? t(`roles.${user.role}`, user.role) : '',
    displayAppName,
    isDesktop,
    sidebarOpen,
    mobileNavOpen,
    navLabelsVisible,
    setMobileNavOpen,
    toggleSidebar,
    onSidebarTransitionEnd,
    handleLogout,
    topLinkClass: ({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`,
    subLinkClass: ({ isActive }) => `admin-nav-sublink ${isActive ? 'admin-nav-sublink--active' : ''}`,
    showDashboard: hasModule('dashboard'),
    showAssistant: hasModule('aiAssistant'),
    // Pharmacy SPA: касса — базовый экран. Custom ACL без cashierPos раньше прятал пункт у ADMIN.
    showPos: hasModule('cashierPos')
      || user?.role === 'ADMIN'
      || user?.role === 'MANAGER'
      || user?.role === 'CASHIER',
    inAssistantSection: pathStarts(path, '/assistant'),
    showStock: stockNav.length > 0,
    showSales: salesNav.length > 0,
    showFinance: financeNav.length > 0,
    showRegisters: registersNav.length > 0,
    showReports: reportsSalesNav.length > 0 || reportsStockNav.length > 0,
    showUsers: usersNav.length > 0,
    inStockSection: pathStarts(path, '/stock'),
    inSalesSection: pathStarts(path, '/sales') || pathStarts(path, '/returns'),
    inFinanceSection: pathStarts(path, '/finance'),
    inRegistersSection: pathStarts(path, '/cash-registers'),
    inReportsSection: pathStarts(path, '/reports'),
    inReportsSalesSection:
      pathStarts(path, '/reports/sales')
      || pathStarts(path, '/reports/returns'),
    inReportsStockSection: pathStarts(path, '/reports/stock'),
    inUsersSection: pathStarts(path, '/users'),
    stockOpen,
    salesOpen,
    financeOpen,
    registersOpen,
    reportsOpen,
    reportsSalesOpen,
    reportsStockOpen,
    usersOpen,
    setStockOpen,
    setSalesOpen,
    setFinanceOpen,
    setRegistersOpen,
    setReportsOpen,
    setReportsSalesOpen,
    setReportsStockOpen,
    setUsersOpen,
    stockNav,
    salesNav,
    financeNav,
    registersNav,
    showReportsSales: reportsSalesNav.length > 0,
    showReportsStock: reportsStockNav.length > 0,
    reportsSalesNav,
    reportsStockNav,
    reportsHubActive: path === '/reports',
    usersNav,
    visibleRest,
  };
}
