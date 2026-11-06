import { useEffect } from 'react';
import BillingAccessGuard from '../../router/guards/BillingAccessGuard';
import PharmacyAdminSidebar from './PharmacyAdminSidebar';
import PharmacyAdminTopbar from './PharmacyAdminTopbar';
import PharmacyShellOutlet from './PharmacyShellOutlet';
import { prefetchPharmacyAdminPages } from './prefetchPharmacyAdminPages';
import { usePharmacyAdminShell } from './usePharmacyAdminShell';

/** Product admin chrome: sidebar + topbar (same shell tokens as web AppShell). */
export default function PharmacyAdminShell() {
  const s = usePharmacyAdminShell();

  useEffect(() => {
    prefetchPharmacyAdminPages();
  }, []);

  return (
    <div className="admin-shell flex overflow-hidden text-[color:var(--admin-text)] print:!bg-white print:!text-black print:min-h-0">
      <PharmacyAdminSidebar
        t={s.t}
        displayAppName={s.displayAppName}
        mobileNavOpen={s.mobileNavOpen}
        isDesktop={s.isDesktop}
        sidebarOpen={s.sidebarOpen}
        navLabelsVisible={s.navLabelsVisible}
        onSidebarTransitionEnd={s.onSidebarTransitionEnd}
        onCloseMobile={() => s.setMobileNavOpen(false)}
        onLogout={s.handleLogout}
        topLinkClass={s.topLinkClass}
        subLinkClass={s.subLinkClass}
        showDashboard={s.showDashboard}
        showAssistant={s.showAssistant}
        inAssistantSection={s.inAssistantSection}
        showPos={s.showPos}
        showStock={s.showStock}
        showSales={s.showSales}
        showFinance={s.showFinance}
        showRegisters={s.showRegisters}
        showReports={s.showReports}
        showUsers={s.showUsers}
        inStockSection={s.inStockSection}
        inSalesSection={s.inSalesSection}
        inFinanceSection={s.inFinanceSection}
        inRegistersSection={s.inRegistersSection}
        inReportsSection={s.inReportsSection}
        inReportsSalesSection={s.inReportsSalesSection}
        inReportsStockSection={s.inReportsStockSection}
        inUsersSection={s.inUsersSection}
        stockOpen={s.stockOpen}
        salesOpen={s.salesOpen}
        financeOpen={s.financeOpen}
        registersOpen={s.registersOpen}
        reportsOpen={s.reportsOpen}
        reportsSalesOpen={s.reportsSalesOpen}
        reportsStockOpen={s.reportsStockOpen}
        usersOpen={s.usersOpen}
        setStockOpen={s.setStockOpen}
        setSalesOpen={s.setSalesOpen}
        setFinanceOpen={s.setFinanceOpen}
        setRegistersOpen={s.setRegistersOpen}
        setReportsOpen={s.setReportsOpen}
        setReportsSalesOpen={s.setReportsSalesOpen}
        setReportsStockOpen={s.setReportsStockOpen}
        setUsersOpen={s.setUsersOpen}
        stockNav={s.stockNav}
        salesNav={s.salesNav}
        financeNav={s.financeNav}
        registersNav={s.registersNav}
        showReportsSales={s.showReportsSales}
        showReportsStock={s.showReportsStock}
        reportsSalesNav={s.reportsSalesNav}
        reportsStockNav={s.reportsStockNav}
        reportsHubActive={s.reportsHubActive}
        usersNav={s.usersNav}
        visibleRest={s.visibleRest}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PharmacyAdminTopbar
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
            <PharmacyShellOutlet />
          </BillingAccessGuard>
        </main>
      </div>
    </div>
  );
}
