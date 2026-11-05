import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TAB_CONFIGS = [
  { to: '/platform/analytics', key: 'analytics.tabOverview', defaultLabel: 'Umumiy', end: true },
  { to: '/platform/analytics/regions', key: 'analytics.tabRegions', defaultLabel: 'Hududlar' },
  { to: '/platform/analytics/companies', key: 'analytics.tabCompanies', defaultLabel: 'Korxonalar' },
  { to: '/platform/analytics/comparison', key: 'analytics.tabComparison', defaultLabel: 'Solishtirish', alt: '/platform/analytics/compare' },
  { to: '/platform/analytics/receipts', key: 'analytics.tabReceipts', defaultLabel: 'Cheklar' },
  { to: '/platform/analytics/reports', key: 'analytics.tabReports', defaultLabel: 'Hisobotlar' },
];

export default function AnalyticsTabs() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="tabs" aria-label="Analitika bo‘limlari">
      {TAB_CONFIGS.map((tab) => {
        const isAltActive = tab.alt && location.pathname.startsWith(tab.alt);
        return (
          <NavLink
            key={tab.to}
            to={{ pathname: tab.to, search: location.search }}
            end={tab.end}
            className={({ isActive }) => (isActive || isAltActive ? 'on' : '')}
          >
            {t(tab.key, tab.defaultLabel)}
          </NavLink>
        );
      })}
    </nav>
  );
}
