import React from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../layoutNavConfig';

export default function SidebarTopLinks({
  showDashboard,
  showAssistant,
  inAssistantSection,
  navLabelsVisible,
  topLinkClass,
  t,
}) {
  return (
    <>
      {showDashboard ? (
        <NavLink to="/dashboard" end className={topLinkClass}>
          <ICONS.LayoutDashboard size={18} className="flex-shrink-0" />
          {navLabelsVisible && t('nav.dashboard')}
        </NavLink>
      ) : null}

      {showAssistant ? (
        <NavLink
          to="/assistant"
          className={({ isActive }) => topLinkClass({ isActive: isActive || inAssistantSection })}
        >
          <ICONS.Bot size={18} className="flex-shrink-0" />
          {navLabelsVisible && t('nav.aiAssistant')}
        </NavLink>
      ) : null}

      <NavLink to="/handbook/dashboard" className={topLinkClass}>
        <ICONS.BookOpen size={18} className="flex-shrink-0" />
        {navLabelsVisible && t('nav.handbook')}
      </NavLink>

      <NavLink to="/support" className={topLinkClass}>
        <ICONS.Headphones size={18} className="flex-shrink-0" />
        {navLabelsVisible && t('nav.support')}
      </NavLink>
    </>
  );
}
