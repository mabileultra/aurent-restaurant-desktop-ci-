import BillingAccessGuard from '../../router/guards/BillingAccessGuard';
import ShellOutlet from '../shared/ShellOutlet';
import AppSidebar from './AppSidebar';
import AppTopHeader from './AppTopHeader';
import { useAppShellLayoutState } from './useAppShellLayoutState';
import {
  GOODS_ROUTES,
  STOCK_ROUTES,
  ORDER_ROUTES,
  FINANCE_ROUTES,
  REGISTER_ROUTES,
  USER_ROUTES,
  REPORT_ROUTES,
  REPORT_SALES_ROUTES,
  REPORT_STOCK_ROUTES,
} from './layoutNavConfig';
import PharmacyLegacyDesktopForceGate from '../../features/desktop/components/PharmacyLegacyDesktopForceGate';
import '../../styles/cashier/modals/index.css';

const topLinkClass = ({ isActive }) =>
  `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`;
const subLinkClass = ({ isActive }) =>
  `admin-nav-sublink ${isActive ? 'admin-nav-sublink--active' : ''}`;

export default function AppShellLayout() {
  const s = useAppShellLayoutState();

  return (
    <div className="admin-shell flex overflow-hidden text-[color:var(--admin-text)] print:!bg-white print:!text-black print:min-h-0">
      <AppSidebar
        t={s.t}
        user={s.user}
        displayAppName={s.displayAppName}
        mobileNavOpen={s.mobileNavOpen}
        isDesktop={s.isDesktop}
        sidebarOpen={s.sidebarOpen}
        navLabelsVisible={s.navLabelsVisible}
        onSidebarTransitionEnd={s.onSidebarTransitionEnd}
        onCloseMobile={() => s.setMobileNavOpen(false)}
        onLogout={s.handleLogout}
        topLinkClass={topLinkClass}
        subLinkClass={subLinkClass}
        showDashboard={!s.isPharmacyCompany && s.hasModule('dashboard')}
        showAssistant={!s.isPharmacyCompany && s.hasModule('aiAssistant')}
        inAssistantSection={s.location.pathname.startsWith('/assistant')}
        showGoods={s.goodsNav.length > 0}
        showStock={s.stockNav.length > 0}
        showOrders={s.ordersNav.length > 0}
        showFinance={s.financeNav.length > 0}
        showRegisters={s.registersNav.length > 0}
        showReports={s.reportsSalesNav.length > 0 || s.reportsStockNav.length > 0}
        showUsers={s.usersNav.length > 0}
        inGoodsSection={GOODS_ROUTES.includes(s.location.pathname)}
        inStockSection={STOCK_ROUTES.includes(s.location.pathname)}
        inOrdersSection={ORDER_ROUTES.includes(s.location.pathname)}
        inFinanceSection={FINANCE_ROUTES.includes(s.location.pathname)}
        inRegistersSection={REGISTER_ROUTES.includes(s.location.pathname)}
        inReportsSection={REPORT_ROUTES.includes(s.location.pathname)}
        inReportsSalesSection={REPORT_SALES_ROUTES.includes(s.location.pathname)}
        inReportsStockSection={REPORT_STOCK_ROUTES.includes(s.location.pathname)}
        inUsersSection={USER_ROUTES.includes(s.location.pathname)}
        goodsOpen={s.goodsOpen}
        stockOpen={s.stockOpen}
        ordersOpen={s.ordersOpen}
        financeOpen={s.financeOpen}
        registersOpen={s.registersOpen}
        reportsOpen={s.reportsOpen}
        reportsSalesOpen={s.reportsSalesOpen}
        reportsStockOpen={s.reportsStockOpen}
        usersOpen={s.usersOpen}
        setGoodsOpen={s.setGoodsOpen}
        setStockOpen={s.setStockOpen}
        setOrdersOpen={s.setOrdersOpen}
        setFinanceOpen={s.setFinanceOpen}
        setRegistersOpen={s.setRegistersOpen}
        setReportsOpen={s.setReportsOpen}
        setReportsSalesOpen={s.setReportsSalesOpen}
        setReportsStockOpen={s.setReportsStockOpen}
        setUsersOpen={s.setUsersOpen}
        goodsNav={s.goodsNav}
        stockNav={s.stockNav}
        ordersNav={s.ordersNav}
        financeNav={s.financeNav}
        registersNav={s.registersNav}
        showReportsSales={s.reportsSalesNav.length > 0}
        showReportsStock={s.reportsStockNav.length > 0}
        reportsSalesNav={s.reportsSalesNav}
        reportsStockNav={s.reportsStockNav}
        reportsHubActive={s.location.pathname === '/reports'}
        usersNav={s.usersNav}
        visibleRest={s.visibleRest}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopHeader
          t={s.t}
          user={s.user}
          roleLabel={s.roleLabel}
          displayAppName={s.displayAppName}
          isDesktop={s.isDesktop}
          sidebarOpen={s.sidebarOpen}
          mobileNavOpen={s.mobileNavOpen}
          onToggleSidebar={s.toggleSidebar}
        />
        <main className="admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 print:!bg-white print:p-4">
          <BillingAccessGuard>
            <ShellOutlet />
          </BillingAccessGuard>
        </main>
      </div>
      <PharmacyLegacyDesktopForceGate />
    </div>
  );
}
