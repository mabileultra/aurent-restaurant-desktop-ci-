import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { ICONS, REPORT_HUB } from '../layoutNavConfig';

export default function SidebarReportsExpanded({
  t,
  reportsOpen,
  onReportsToggle,
  inReportsSection,
  reportsHubActive,
  reportsSalesOpen,
  onReportsSalesToggle,
  inReportsSalesSection,
  showReportsSales,
  reportsSalesNav,
  reportsStockOpen,
  onReportsStockToggle,
  inReportsStockSection,
  showReportsStock,
  reportsStockNav,
  subLinkClass,
}) {
  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={onReportsToggle}
        className={`admin-nav-group-btn ${inReportsSection ? 'admin-nav-group-btn--active' : ''}`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <ICONS.BarChart2 size={18} className="flex-shrink-0 opacity-90" />
          <span className="truncate">{t('nav.reportsGroup')}</span>
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${reportsOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {reportsOpen ? (
        <div className="admin-nav-group-rail space-y-1">
          <NavLink
            to={REPORT_HUB.to}
            end
            className={({ isActive }) =>
              `admin-nav-sublink ${isActive || reportsHubActive ? 'admin-nav-sublink--active' : ''}`
            }
          >
            <REPORT_HUB.icon size={16} className="flex-shrink-0 opacity-80" />
            {t(`nav.${REPORT_HUB.key}`)}
          </NavLink>

          {showReportsSales ? (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={onReportsSalesToggle}
                className={`admin-nav-group-btn ml-2 w-[calc(100%-0.5rem)] !py-2 !text-xs !font-semibold uppercase tracking-wide ${
                  inReportsSalesSection ? 'admin-nav-group-btn--active' : ''
                }`}
              >
                <span className="truncate">{t('nav.reportsSalesGroup')}</span>
                <ChevronDown
                  size={14}
                  className={`flex-shrink-0 transition-transform ${reportsSalesOpen ? '' : '-rotate-90'}`}
                />
              </button>
              {reportsSalesOpen ? (
                <div className="admin-nav-group-rail ml-3 space-y-0.5">
                  {reportsSalesNav.map(({ to, key, icon: Icon }) => (
                    <NavLink key={to} to={to} className={subLinkClass}>
                      <Icon size={16} className="flex-shrink-0 opacity-80" />
                      {t(`nav.${key}`)}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {showReportsStock ? (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={onReportsStockToggle}
                className={`admin-nav-group-btn ml-2 w-[calc(100%-0.5rem)] !py-2 !text-xs !font-semibold uppercase tracking-wide ${
                  inReportsStockSection ? 'admin-nav-group-btn--active' : ''
                }`}
              >
                <span className="truncate">{t('nav.reportsStockGroup')}</span>
                <ChevronDown
                  size={14}
                  className={`flex-shrink-0 transition-transform ${reportsStockOpen ? '' : '-rotate-90'}`}
                />
              </button>
              {reportsStockOpen ? (
                <div className="admin-nav-group-rail ml-3 space-y-0.5">
                  {reportsStockNav.map(({ to, key, icon: Icon }) => (
                    <NavLink key={to} to={to} className={subLinkClass}>
                      <Icon size={16} className="flex-shrink-0 opacity-80" />
                      {t(`nav.${key}`)}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
