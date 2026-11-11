import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Store,
  Users,
  KeyRound,
  Activity,
  Mail,
  ShieldCheck,
  Layers,
  Bell,
  BookOpen,
  Inbox,
  Wallet,
  CircleUser,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import SuperAdminSidebarItem from './SuperAdminSidebarItem';

const NAV_ICONS = {
  '/platform/companies': Building2,
  '/platform/stores': Store,
  '/platform/users': Users,
  '/platform/access': KeyRound,
  '/platform/business-types': Layers,
  '/platform/reference-books': BookOpen,
  '/platform/leads': Inbox,
  '/platform/billing': Wallet,
  '/platform/analytics': BarChart3,
  '/platform/monitoring': Activity,
  '/platform/email': Mail,
  '/platform/desktop-notifications': Bell,
  '/platform/security': ShieldCheck,
  '/platform/account': CircleUser,
};

export default function SuperAdminSidebar({
  className = '',
  groupedLinks = [],
  openGroups = {},
  toggleGroup,
  location,
  onCloseMobileNav,
}) {
  const { t } = useTranslation();

  return (
    <aside
      className={`w-[248px] shrink-0 bg-aa-surface border-r border-aa-line flex flex-col h-full select-none ${className}`}
      data-purpose="sidebar"
    >
      {/* 64px Header: Logo + Title */}
      <div className="h-16 px-5 border-b border-aa-line flex items-center gap-3 shrink-0">
        <img
          src="/brand/logonew.png"
          alt="Aurent"
          className="h-8 w-auto shrink-0"
        />
        <div className="flex flex-col min-w-0 leading-tight">
          <span className="text-[14px] leading-[20px] font-semibold text-aa-ink truncate">
            Aurent
          </span>
          <span className="text-[13px] leading-[18px] text-aa-ink-muted truncate">
            Super-admin
          </span>
        </div>
      </div>

      {/* Accordion Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
        data-purpose="accordion-navigation"
      >
        {groupedLinks.map((group) => {
          const isOpen = openGroups[group.id] ?? true;
          return (
            <div key={group.id} className="pb-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between text-[12px] leading-[16px] font-semibold text-aa-ink-muted pt-4 px-3 pb-2 select-none hover:text-aa-ink transition cursor-pointer"
                aria-expanded={isOpen}
                aria-controls={`accordion-group-${group.id}`}
              >
                <span>{t(group.key)}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 text-aa-ink-muted ${
                    isOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {isOpen ? (
                <div
                  id={`accordion-group-${group.id}`}
                  role="region"
                  className="space-y-1 mt-1"
                >
                  {group.items.map((item) => (
                    <SuperAdminSidebarItem
                      key={item.to}
                      item={item}
                      location={location}
                      onCloseMobileNav={onCloseMobileNav}
                      NAV_ICONS={NAV_ICONS}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
