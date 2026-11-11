import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import NavItem from '../aa/NavItem';

/**
 * Aurent Admin — Super-admin sidebar menyu bandi.
 * NavItem (40px, radius 8, ikonka 16px) dan foydalanadi.
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

  const isCurrentOrDescendant =
    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  const [isOpenManual, setIsOpenManual] = useState(null);
  const isOpen = isOpenManual ?? isCurrentOrDescendant;

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpenManual((prev) => !(prev ?? isCurrentOrDescendant));
  };

  if (!hasChildren) {
    return (
      <NavItem
        to={item.to}
        icon={Icon ? <Icon size={16} /> : null}
        label={t(item.key)}
        onClick={onCloseMobileNav}
      />
    );
  }

  return (
    <div>
      <div className="relative flex items-center">
        <NavItem
          to={item.to}
          icon={Icon ? <Icon size={16} /> : null}
          label={t(item.key)}
          onClick={onCloseMobileNav}
          className="pr-8"
        />
        <button
          type="button"
          onClick={handleToggle}
          aria-label={t(item.key)}
          className="absolute right-1 w-7 h-7 flex items-center justify-center rounded-aa-sm hover:bg-aa-surface-hover text-aa-ink-muted transition cursor-pointer"
        >
          <ChevronRight
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {isOpen ? (
        <div className="mt-1 space-y-1 pl-6" role="group" aria-label={t(item.key)}>
          {item.children.map((child) => (
            <NavItem
              key={child.to}
              to={child.to}
              end={Boolean(child.end)}
              label={t(child.key)}
              onClick={onCloseMobileNav}
              className="h-9 text-[13px]"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
