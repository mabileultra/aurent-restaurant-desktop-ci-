import { NavLink } from 'react-router-dom';
import BrandMark from '../../components/shared/BrandMark';
import {
  PHARM_ASSISTANT_ITEM,
  PHARM_DASHBOARD_ITEM,
  PHARM_HANDBOOK_ITEM,
  PHARM_ICONS,
  PHARM_POS_ITEM,
  PHARM_REPORT_HUB,
  PHARM_SUPPORT_ITEM,
} from './pharmacyAdminNavConfig';
import SidebarGroupCompact from './sidebar/SidebarGroupCompact';
import SidebarNavGroup from './sidebar/SidebarNavGroup';
import SidebarReportsExpanded from './sidebar/SidebarReportsExpanded';

export default function PharmacyAdminSidebar(p) {
  const {
    t,
    displayAppName,
    mobileNavOpen,
    sidebarOpen,
    navLabelsVisible,
    onSidebarTransitionEnd,
    onCloseMobile,
    onLogout,
    topLinkClass,
    subLinkClass,
    showDashboard,
    showAssistant,
    inAssistantSection,
    showPos,
    showStock,
    showSales,
    showFinance,
    showRegisters,
    showReports,
    showUsers,
    inStockSection,
    inSalesSection,
    inFinanceSection,
    inRegistersSection,
    inReportsSection,
    inReportsSalesSection,
    inReportsStockSection,
    inUsersSection,
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
    showReportsSales,
    showReportsStock,
    reportsSalesNav,
    reportsStockNav,
    reportsHubActive,
    usersNav,
    visibleRest,
  } = p;

  return (
    <>
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/50 print:hidden lg:hidden"
          aria-label={t('nav.closeMenu')}
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        onTransitionEnd={onSidebarTransitionEnd}
        className={`admin-sidebar print:hidden fixed inset-y-0 left-0 z-40 flex max-w-[min(100vw,20rem)] flex-col overflow-hidden shadow-xl transition-[transform,width] duration-200 ease-out lg:static lg:z-auto lg:max-w-none lg:shadow-none ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarOpen ? 'w-[min(100vw,20rem)] lg:w-60' : 'w-[min(100vw,20rem)] lg:w-16'}`}
      >
        <div className="admin-sidebar__brand flex h-16 items-center gap-3 px-4">
          <BrandMark variant="full" size={32} height={navLabelsVisible ? 32 : 28} />
          {navLabelsVisible ? (
            <span className="admin-sidebar__brand-name truncate text-lg">{displayAppName()}</span>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {showDashboard ? (
            <NavLink to={PHARM_DASHBOARD_ITEM.to} end className={topLinkClass}>
              <PHARM_DASHBOARD_ITEM.icon size={18} className="flex-shrink-0" />
              {navLabelsVisible && t('nav.dashboard')}
            </NavLink>
          ) : null}

          {showAssistant ? (
            <NavLink
              to={PHARM_ASSISTANT_ITEM.to}
              className={({ isActive }) => topLinkClass({ isActive: isActive || inAssistantSection })}
            >
              <PHARM_ASSISTANT_ITEM.icon size={18} className="flex-shrink-0" />
              {navLabelsVisible && t(`nav.${PHARM_ASSISTANT_ITEM.key}`)}
            </NavLink>
          ) : null}

          <NavLink to={PHARM_HANDBOOK_ITEM.to} className={topLinkClass}>
            <PHARM_HANDBOOK_ITEM.icon size={18} className="flex-shrink-0" />
            {navLabelsVisible && t(`nav.${PHARM_HANDBOOK_ITEM.key}`)}
          </NavLink>

          <NavLink to={PHARM_SUPPORT_ITEM.to} className={topLinkClass}>
            <PHARM_SUPPORT_ITEM.icon size={18} className="flex-shrink-0" />
            {navLabelsVisible && t(`nav.${PHARM_SUPPORT_ITEM.key}`)}
          </NavLink>

          {showPos ? (
            <NavLink to={PHARM_POS_ITEM.to} className={topLinkClass}>
              <PHARM_POS_ITEM.icon size={18} className="flex-shrink-0" />
              {navLabelsVisible && t('nav.cashier', { defaultValue: 'Касса' })}
            </NavLink>
          ) : null}

          <SidebarNavGroup
            show={showStock}
            labels={navLabelsVisible}
            t={t}
            label={t('nav.stockGroup')}
            icon={PHARM_ICONS.Home}
            open={stockOpen}
            setOpen={setStockOpen}
            active={inStockSection}
            items={stockNav}
            subLinkClass={subLinkClass}
          />

          <SidebarNavGroup
            show={showSales}
            labels={navLabelsVisible}
            t={t}
            label={t('nav.salesGroup')}
            icon={PHARM_ICONS.Package}
            open={salesOpen}
            setOpen={setSalesOpen}
            active={inSalesSection}
            items={salesNav}
            subLinkClass={subLinkClass}
          />

          <SidebarNavGroup
            show={showFinance}
            labels={navLabelsVisible}
            t={t}
            label={t('nav.financeGroup')}
            icon={PHARM_ICONS.Calculator}
            open={financeOpen}
            setOpen={setFinanceOpen}
            active={inFinanceSection}
            items={financeNav}
            subLinkClass={subLinkClass}
          />

          <SidebarNavGroup
            show={showRegisters}
            labels={navLabelsVisible}
            t={t}
            label={t('nav.registersGroup')}
            icon={PHARM_ICONS.Calculator}
            open={registersOpen}
            setOpen={setRegistersOpen}
            active={inRegistersSection}
            items={registersNav}
            subLinkClass={subLinkClass}
          />

          {showReports
            ? navLabelsVisible ? (
                <SidebarReportsExpanded
                  t={t}
                  reportsOpen={reportsOpen}
                  onReportsToggle={() => setReportsOpen((o) => !o)}
                  inReportsSection={inReportsSection}
                  reportsHubActive={reportsHubActive}
                  reportsSalesOpen={reportsSalesOpen}
                  onReportsSalesToggle={() => setReportsSalesOpen((o) => !o)}
                  inReportsSalesSection={inReportsSalesSection}
                  showReportsSales={showReportsSales}
                  reportsSalesNav={reportsSalesNav}
                  reportsStockOpen={reportsStockOpen}
                  onReportsStockToggle={() => setReportsStockOpen((o) => !o)}
                  inReportsStockSection={inReportsStockSection}
                  showReportsStock={showReportsStock}
                  reportsStockNav={reportsStockNav}
                  subLinkClass={subLinkClass}
                />
              ) : (
                <SidebarGroupCompact
                  t={t}
                  items={[PHARM_REPORT_HUB, ...reportsSalesNav, ...reportsStockNav]}
                />
              )
            : null}

          <SidebarNavGroup
            show={showUsers}
            labels={navLabelsVisible}
            t={t}
            label={t('nav.usersGroup')}
            icon={PHARM_ICONS.Users}
            open={usersOpen}
            setOpen={setUsersOpen}
            active={inUsersSection}
            items={usersNav}
            subLinkClass={subLinkClass}
          />

          {visibleRest.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={topLinkClass}>
              <Icon size={18} className="flex-shrink-0" />
              {navLabelsVisible && t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer p-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          >
            <PHARM_ICONS.LogOut size={18} className="flex-shrink-0" />
            {navLabelsVisible && t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
