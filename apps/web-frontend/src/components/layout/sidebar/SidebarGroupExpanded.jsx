import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function SidebarGroupExpanded({
  t,
  label,
  icon: Icon,
  isOpen,
  onToggle,
  isActive,
  items,
  subLinkClass,
}) {
  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={onToggle}
        className={`admin-nav-group-btn ${isActive ? 'admin-nav-group-btn--active' : ''}`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon size={18} className="flex-shrink-0 opacity-90" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {isOpen ? (
        <div className="admin-nav-group-rail space-y-0.5">
          {items.map(({ to, key, icon: ItemIcon }) => (
            <NavLink key={to} to={to} className={subLinkClass}>
              <ItemIcon size={16} className="flex-shrink-0 opacity-80" />
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
