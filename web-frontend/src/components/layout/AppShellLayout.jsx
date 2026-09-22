import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import BillingAccessGuard from '../../router/guards/BillingAccessGuard';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import AppSidebar from './AppSidebar';
import AppTopHeader from './AppTopHeader';
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
  REPORT_SALES_CHILDREN,
  REPORT_STOCK_CHILDREN,
  REST_NAV,
} from './layoutNavConfig';
import { syncAuthSession } from '../../utils/syncAuthSession';
import { VIEWPORT_MEDIA } from '../../utils/viewportBreakpoints';
import { useCompanyBusinessType } from '../../hooks/useCompanyBusinessType';
import { isRestaurantWorldBusiness } from '../../utils/appHomePath';
import { isRestaurantAppSplitEnabled } from '../../config/restaurantAppUrl';
import { redirectToRestaurantApp } from '../../utils/restaurantAppRedirect';
import '../../styles/cashier/modals/index.css';

export default function AppShellLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { hasModule } = useModuleAccess();
  const { businessType, isLoading: businessTypeLoading } = useCompanyBusinessType();
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

  useEffect(() => {
    // Модули приходят в /auth/refresh (не в JWT) — синхронизируем при входе в оболочку,
    // по фокусу окна (после выдачи прав супер-админом) и периодически.
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
  const [financeOpen, setFinanceOpen] = useState(false);
  const [registersOpen, setRegistersOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  const filterByModule = (items) => items.filter((item) => !item.moduleId || hasModule(item.moduleId));
  const goodsNav = filterByModule(goodsChildrenForBusinessType(businessType));
  const stockNav = filterByModule(stockChildrenForBusinessType(businessType));
  const ordersNav = filterByModule(ORDER_CHILDREN);
  const financeNav = filterByModule(FINANCE_CHILDREN);
  const registersNav = filterByModule(REGISTER_CHILDREN);
  const reportsSalesNav = filterByModule(REPORT_SALES_CHILDREN);
  const reportsStockNav = filterByModule(REPORT_STOCK_CHILDREN);
  const usersNav = filterByModule(USER_CHILDREN);

  useEffect(() => {
    if (businessTypeLoading) return;
    if (!isRestaurantWorldBusiness(businessType)) return;
    if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') return;
    // Restaurant companies → r-aurent when split is on; else legacy /rst on aurent.
    const split = isRestaurantAppSplitEnabled();
    const goRst = (path) => {
      if (split) {
        redirectToRestaurantApp(path, { token, user });
        return;
      }
      navigate(path, { replace: true });
    };
    if (location.pathname === '/dashboard') {
      goRst('/rst/admin/dashboard');
      return;
    }
    if (location.pathname === '/billing' || location.pathname.startsWith('/billing/')) {
      goRst('/rst/admin/billing');
    }
  }, [businessType, businessTypeLoading, location.pathname, navigate, token, user]);

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
    if (STOCK_ROUTES.includes(location.pathname) || location.pathname.startsWith('/pharm/stock/')) {
      setStockOpen(true);
    }
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
  const topLinkClass = ({ isActive }) =>
    `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`;
  const subLinkClass = ({ isActive }) =>
    `admin-nav-sublink ${isActive ? 'admin-nav-sublink--active' : ''}`;

  const visibleRest = filterByModule(REST_NAV).filter(
    (item) => item.to !== '/billing' || user?.role === 'ADMIN'
  );
  const roleLabel = user?.role ? t(`roles.${user.role}`, user.role) : '';

  return (
    <div className="admin-shell flex overflow-hidden text-[color:var(--admin-text)] print:!bg-white print:!text-black print:min-h-0">
      <AppSidebar
        t={t}
        user={user}
        displayAppName={displayAppName}
        mobileNavOpen={mobileNavOpen}
        isDesktop={isDesktop}
        sidebarOpen={sidebarOpen}
        navLabelsVisible={navLabelsVisible}
        onSidebarTransitionEnd={onSidebarTransitionEnd}
        onCloseMobile={() => setMobileNavOpen(false)}
        onLogout={handleLogout}
        topLinkClass={topLinkClass}
        subLinkClass={subLinkClass}
        showDashboard={hasModule('dashboard')}
        showAssistant={hasModule('aiAssistant')}
        inAssistantSection={location.pathname.startsWith('/assistant')}
        showGoods={goodsNav.length > 0}
        showStock={stockNav.length > 0}
        showOrders={ordersNav.length > 0}
        showFinance={financeNav.length > 0}
        showRegisters={registersNav.length > 0}
        showReports={reportsSalesNav.length > 0 || reportsStockNav.length > 0}
        showUsers={usersNav.length > 0}
        inGoodsSection={GOODS_ROUTES.includes(location.pathname)}
        inStockSection={STOCK_ROUTES.includes(location.pathname) || location.pathname.startsWith('/pharm/stock/')}
        inOrdersSection={ORDER_ROUTES.includes(location.pathname)}
        inFinanceSection={FINANCE_ROUTES.includes(location.pathname)}
        inRegistersSection={REGISTER_ROUTES.includes(location.pathname)}
        inReportsSection={REPORT_ROUTES.includes(location.pathname)}
        inReportsSalesSection={REPORT_SALES_ROUTES.includes(location.pathname)}
        inReportsStockSection={REPORT_STOCK_ROUTES.includes(location.pathname)}
        inUsersSection={USER_ROUTES.includes(location.pathname)}
        goodsOpen={goodsOpen}
        stockOpen={stockOpen}
        ordersOpen={ordersOpen}
        financeOpen={financeOpen}
        registersOpen={registersOpen}
        reportsOpen={reportsOpen}
        reportsSalesOpen={reportsSalesOpen}
        reportsStockOpen={reportsStockOpen}
        usersOpen={usersOpen}
        setGoodsOpen={setGoodsOpen}
        setStockOpen={setStockOpen}
        setOrdersOpen={setOrdersOpen}
        setFinanceOpen={setFinanceOpen}
        setRegistersOpen={setRegistersOpen}
        setReportsOpen={setReportsOpen}
        setReportsSalesOpen={setReportsSalesOpen}
        setReportsStockOpen={setReportsStockOpen}
        setUsersOpen={setUsersOpen}
        goodsNav={goodsNav}
        stockNav={stockNav}
        ordersNav={ordersNav}
        financeNav={financeNav}
        registersNav={registersNav}
        showReportsSales={reportsSalesNav.length > 0}
        showReportsStock={reportsStockNav.length > 0}
        reportsSalesNav={reportsSalesNav}
        reportsStockNav={reportsStockNav}
        reportsHubActive={location.pathname === '/reports'}
        usersNav={usersNav}
        visibleRest={visibleRest}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopHeader
          t={t}
          user={user}
          roleLabel={roleLabel}
          displayAppName={displayAppName}
          isDesktop={isDesktop}
          sidebarOpen={sidebarOpen}
          mobileNavOpen={mobileNavOpen}
          onToggleSidebar={toggleSidebar}
        />
        <main className="admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 print:!bg-white print:p-4">
          <BillingAccessGuard>
            <Outlet />
          </BillingAccessGuard>
        </main>
      </div>
    </div>
  );
}

