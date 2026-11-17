import { NavLink } from 'react-router-dom';

export default function SidebarGroupCompact({ t, items }) {
  return (
    <div className="space-y-1 pt-1">
      {items.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={t(`nav.${key}`)}
          className={({ isActive }) =>
            `admin-nav-link justify-center !px-3 ${isActive ? 'admin-nav-link--active' : ''}`
          }
        >
          <Icon size={18} />
        </NavLink>
      ))}
    </div>
  );
}
