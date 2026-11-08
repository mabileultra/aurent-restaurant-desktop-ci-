import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

/**
 * Sidebar menyu elementi (sub-menyu / accordion qo'llab-quvvatlaydi).
 */
export default function SuperAdminSidebarItem({
  item,
  location,
  onCloseMobileNav,
  NAV_ICONS,
}) {
  const { t } = useTranslation();
  const Icon = NAV_ICONS[item.to];
  const hasChildren = Boolean(item.children && item.children.length > 0);

  const isCurrentOrDescendant = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  const [isOpenManual, setIsOpenManual] = useState(null);
  const isOpen = isOpenManual ?? isCurrentOrDescendant;

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpenManual((prev) => !(prev ?? isCurrentOrDescendant));
  };

  if (!hasChildren) {
    return (
      <NavLink
        to={item.to}
        onClick={onCloseMobileNav}
        className={({ isActive }) =>
          `flex items-center space-x-3 py-2.5 rounded-lg text-sm font-medium transition ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold border-l-[3px] border-emerald-600 dark:border-emerald-400 pl-[9px] pr-3 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white border-l-[3px] border-transparent pl-[9px] pr-3'
          }`
        }
      >
        {Icon ? (
          <span className="w-5 h-5 flex items-center justify-center shrink-0 text-current" aria-hidden="true">
            <Icon size={18} />
          </span>
        ) : null}
        <span className="truncate">{t(item.key)}</span>
      </NavLink>
    );
  }

  return (
    <div>
      <div
        className={`flex items-center justify-between py-2 rounded-lg text-sm font-medium transition cursor-pointer select-none ${
          isCurrentOrDescendant
            ? 'bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 font-semibold border-l-[3px] border-emerald-600 dark:border-emerald-400 pl-[9px] pr-2'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white border-l-[3px] border-transparent pl-[9px] pr-2'
        }`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle(e);
          }
        }}
      >
        <div className="flex items-center space-x-3 truncate">
          {Icon ? (
            <span className="w-5 h-5 flex items-center justify-center shrink-0 text-current" aria-hidden="true">
              <Icon size={18} />
            </span>
          ) : null}
          <span className="truncate">{t(item.key)}</span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          aria-label={t(item.key)}
          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
      </div>

      {isOpen ? (
        <div className="mt-1 space-y-1 pl-8" role="group" aria-label={t(item.key)}>
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={Boolean(child.end)}
              onClick={onCloseMobileNav}
              className={({ isActive }) =>
                `block py-1.5 px-3 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 font-semibold border-l-2 border-emerald-500 pl-2.5'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
            >
              {t(child.key)}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
