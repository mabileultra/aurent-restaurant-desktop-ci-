import React from 'react';
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/platform/analytics', label: 'Umumiy', end: true },
  { to: '/platform/analytics/regions', label: 'Hududlar' },
  { to: '/platform/analytics/companies', label: 'Korxonalar' },
  { to: '/platform/analytics/compare', label: 'Solishtirish' },
  { to: '/platform/analytics/receipts', label: 'Cheklar' },
  { to: '/platform/analytics/reports', label: 'Hisobotlar' },
];

export default function AnalyticsTabs() {
  return (
    <nav className="an-tabs" aria-label="Analitika bo‘limlari">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `an-tab${isActive ? ' is-active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
