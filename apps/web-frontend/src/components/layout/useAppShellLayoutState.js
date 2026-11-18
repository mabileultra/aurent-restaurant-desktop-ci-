import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { syncAuthSession } from '../../utils/syncAuthSession';
import { VIEWPORT_MEDIA } from '../../utils/viewportBreakpoints';
import { useCompanyBusinessType } from '../../hooks/useCompanyBusinessType';
import {
  GOODS_ROUTES,
  STOCK_ROUTES,
  ORDER_ROUTES,
  FINANCE_ROUTES,
  FINANCE_CHILDREN,
  REGISTER_ROUTES,
  USER_ROUTES,
  REPORT_ROUTES,
  REPORT_SALES_ROUTES,
  REPORT_STOCK_ROUTES,
  goodsChildrenForBusinessType,
  stockChildrenForBusinessType,
  ORDER_CHILDREN,
  REGISTER_CHILDREN,
  USER_CHILDREN,
  reportSalesChildrenForBusinessType,
  reportStockChildrenForBusinessType,
  REST_NAV,
} from './layoutNavConfig';

export function useAppShellLayoutState() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hasModule } = useModuleAccess();
  const { businessType, isPharmacyCompany } = useCompanyBusinessType();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(VIEWPORT_MEDIA.desktop).matches
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(VIEWPORT_MEDIA.desktop).matches
  );
  const [sidebarNavExpanded, setSidebarNavExpanded] = useState(true);

  const [goodsOpen, setGoodsOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reportsSalesOpen, setReportsSalesOpen] = useState(false);
  const [reportsStockOpen, setReportsStockOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [registersOpen, setRegistersOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

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

  const filterByModule = (items) => items.filter((item) => !item.moduleId || hasModule(item.moduleId));
  const goodsNav = filterByModule(goodsChildrenForBusinessType(businessType));
  const stockNav = filterByModule(stockChildrenForBusinessType(businessType));
  const ordersNav = filterByModule(ORDER_CHILDREN);
  const financeNav = isPharmacyCompany ? [] : filterByModule(FINANCE_CHILDREN);
  const registersNav = isPharmacyCompany ? [] : filterByModule(REGISTER_CHILDREN);
  const reportsSalesNav = filterByModule(reportSalesChildrenForBusinessType(businessType));
  const reportsStockNav = filterByModule(reportStockChildrenForBusinessType(businessType));
  const usersNav = isPharmacyCompany ? [] : filterByModule(USER_CHILDREN);

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

  useEffect(() => {
    if (GOODS_ROUTES.includes(location.pathname)) setGoodsOpen(true);
    if (STOCK_ROUTES.includes(location.pathname)) setStockOpen(true);
    if (REPORT_ROUTES.includes(location.pathname)) setReportsOpen(true);
    if (REPORT_SALES_ROUTES.includes(location.pathname)) setReportsSalesOpen(true);
    if (REPORT_STOCK_ROUTES.includes(location.pathname)) setReportsStockOpen(true);
    if (location.pathname === '/reports') {
      setReportsOpen(true);
      setReportsSalesOpen(true);
      setReportsStockOpen(true);
    }
    if (FINANCE_ROUTES.includes(location.pathname)) setFinanceOpen(true);
    if (REGISTER_ROUTES.includes(location.pathname)) setRegistersOpen(true);
    if (USER_ROUTES.includes(location.pathname)) setUsersOpen(true);
    if (ORDER_ROUTES.includes(location.pathname)) setOrdersOpen(true);
  }, [location.pathname]);

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

  const visibleRest = isPharmacyCompany
    ? []
    : filterByModule(REST_NAV).filter(
      (item) => item.to !== '/billing' || user?.role === 'ADMIN'
    );
  const roleLabel = user?.role ? t(`roles.${user.role}`, user.role) : '';

  return {
    t,
    user,
    location,
    roleLabel,
    displayAppName,
    isDesktop,
    sidebarOpen,
    mobileNavOpen,
    setMobileNavOpen,
    navLabelsVisible,
    onSidebarTransitionEnd,
    handleLogout,
    toggleSidebar,
    isPharmacyCompany,
    hasModule,
    goodsNav,
    stockNav,
    ordersNav,
    financeNav,
    registersNav,
    reportsSalesNav,
    reportsStockNav,
    usersNav,
    visibleRest,
    goodsOpen, setGoodsOpen,
    stockOpen, setStockOpen,
    ordersOpen, setOrdersOpen,
    financeOpen, setFinanceOpen,
    registersOpen, setRegistersOpen,
    reportsOpen, setReportsOpen,
    reportsSalesOpen, setReportsSalesOpen,
    reportsStockOpen, setReportsStockOpen,
    usersOpen, setUsersOpen,
  };
}
