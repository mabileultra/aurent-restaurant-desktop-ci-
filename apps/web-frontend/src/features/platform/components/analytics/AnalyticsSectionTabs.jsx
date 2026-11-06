import React from 'react';
import { NavLink } from 'react-router-dom';

export default function AnalyticsSectionTabs({ t }) {
  return (
    <div className="ta-period ca-tabs">
      <NavLink
        to="/platform/analytics"
        end
        className={({ isActive }) => `ta-period__btn${isActive ? ' is-active' : ''}`}
      >
        {t('platform.analytics.tabRegions')}
      </NavLink>
      <NavLink
        to="/platform/analytics/companies"
        className={({ isActive }) => `ta-period__btn${isActive ? ' is-active' : ''}`}
      >
        {t('platform.analytics.tabCompanies')}
      </NavLink>
    </div>
  );
}
