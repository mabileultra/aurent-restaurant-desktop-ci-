import React from 'react';
import { NavLink } from 'react-router-dom';
import BrandMark from '../shared/BrandMark';
import { ICONS } from './layoutNavConfig';
import SidebarNavSection from './sidebar/SidebarNavSection';
import SidebarTopLinks from './sidebar/SidebarTopLinks';
import SidebarReportsSection from './sidebar/SidebarReportsSection';

export default function AppSidebar(props) {
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
    visibleRest,
  } = props;

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
          <SidebarTopLinks
            showDashboard={props.showDashboard}
            showAssistant={props.showAssistant}
            inAssistantSection={props.inAssistantSection}
            navLabelsVisible={navLabelsVisible}
            topLinkClass={topLinkClass}
            t={t}
          />

          <SidebarNavSection
            show={props.showGoods}
            navLabelsVisible={navLabelsVisible}
            label={t('nav.goodsGroup')}
            icon={ICONS.LayoutGrid}
            isOpen={props.goodsOpen}
            onToggle={() => props.setGoodsOpen((o) => !o)}
            isActive={props.inGoodsSection}
            items={props.goodsNav}
            subLinkClass={subLinkClass}
            t={t}
          />

          <SidebarNavSection
            show={props.showStock}
            navLabelsVisible={navLabelsVisible}
            label={t('nav.stockGroup')}
            icon={ICONS.Home}
            isOpen={props.stockOpen}
            onToggle={() => props.setStockOpen((o) => !o)}
            isActive={props.inStockSection}
            items={props.stockNav}
            subLinkClass={subLinkClass}
            t={t}
          />

          <SidebarNavSection
            show={props.showOrders}
            navLabelsVisible={navLabelsVisible}
            label={t('nav.ordersGroup')}
            icon={ICONS.Truck}
            isOpen={props.ordersOpen}
            onToggle={() => props.setOrdersOpen((o) => !o)}
            isActive={props.inOrdersSection}
            items={props.ordersNav}
            subLinkClass={subLinkClass}
            t={t}
          />

          <SidebarNavSection
            show={props.showFinance}
            navLabelsVisible={navLabelsVisible}
            label={t('nav.financeGroup')}
            icon={ICONS.Calculator}
            isOpen={props.financeOpen}
            onToggle={() => props.setFinanceOpen((o) => !o)}
            isActive={props.inFinanceSection}
            items={props.financeNav}
            subLinkClass={subLinkClass}
            t={t}
          />

          <SidebarNavSection
            show={props.showRegisters}
            navLabelsVisible={navLabelsVisible}
            label={t('nav.registersGroup')}
            icon={ICONS.Calculator}
            isOpen={props.registersOpen}
            onToggle={() => props.setRegistersOpen((o) => !o)}
            isActive={props.inRegistersSection}
            items={props.registersNav}
            subLinkClass={subLinkClass}
            t={t}
          />

          <SidebarReportsSection
            showReports={props.showReports}
            navLabelsVisible={navLabelsVisible}
            reportsOpen={props.reportsOpen}
            setReportsOpen={props.setReportsOpen}
            inReportsSection={props.inReportsSection}
            reportsHubActive={props.reportsHubActive}
            reportsSalesOpen={props.reportsSalesOpen}
            setReportsSalesOpen={props.setReportsSalesOpen}
            inReportsSalesSection={props.inReportsSalesSection}
            showReportsSales={props.showReportsSales}
            reportsSalesNav={props.reportsSalesNav}
            reportsStockOpen={props.reportsStockOpen}
            setReportsStockOpen={props.setReportsStockOpen}
            inReportsStockSection={props.inReportsStockSection}
            showReportsStock={props.showReportsStock}
            reportsStockNav={props.reportsStockNav}
            subLinkClass={subLinkClass}
            t={t}
          />

          <SidebarNavSection
            show={props.showUsers}
            navLabelsVisible={navLabelsVisible}
            label={t('nav.usersGroup')}
            icon={ICONS.Users}
            isOpen={props.usersOpen}
            onToggle={() => props.setUsersOpen((o) => !o)}
            isActive={props.inUsersSection}
            items={props.usersNav}
            subLinkClass={subLinkClass}
            t={t}
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
            <ICONS.LogOut size={18} className="flex-shrink-0" />
            {navLabelsVisible && t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
