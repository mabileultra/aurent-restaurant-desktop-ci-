import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/platform/analytics', label: 'Umumiy', end: true },
  { to: '/platform/analytics/regions', label: 'Hududlar' },
  { to: '/platform/analytics/companies', label: 'Korxonalar' },
  { to: '/platform/analytics/comparison', label: 'Solishtirish', alt: '/platform/analytics/compare' },
  { to: '/platform/analytics/receipts', label: 'Cheklar' },
  { to: '/platform/analytics/reports', label: 'Hisobotlar' },
];

export default function AnalyticsTabs() {
  const location = useLocation();

  return (
    <nav className="tabs" aria-label="Analitika bo‘limlari">
      {TABS.map((tab) => {
        const isAltActive = tab.alt && location.pathname.startsWith(tab.alt);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => (isActive || isAltActive ? 'on' : '')}
          >
            {tab.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
