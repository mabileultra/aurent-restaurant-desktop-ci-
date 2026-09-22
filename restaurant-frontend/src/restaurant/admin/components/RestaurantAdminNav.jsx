import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { RST_NAV_GROUP_ICONS, RST_NAV_ITEM_ICONS } from '../config/adminNavIcons';
import '../styles/admin-nav-groups.css';

function groupHasActive(group, pathname) {
  return group.items.some((item) => {
    if (item.end) return pathname === item.to || pathname === `${item.to}/`;
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  });
}

function NavItemLink({ item, t }) {
  const ItemIcon = RST_NAV_ITEM_ICONS[item.key];
  return (
    <NavLink
      to={item.to}
      end={Boolean(item.end)}
      className={({ isActive }) => `rst-shell__link${isActive ? ' is-active' : ''}${item.enabled ? '' : ' is-disabled'}`}
    >
      <span className="rst-shell__link-main">
        {ItemIcon ? <ItemIcon size={16} strokeWidth={2.15} className="rst-shell__ico" aria-hidden /> : null}
        <span>{t(`rst.nav.${item.key}`)}</span>
      </span>
      {!item.enabled ? <span className="rst-shell__stage">{t('rst.nav.later')}</span> : null}
    </NavLink>
  );
}

/**
 * Grouped admin nav with expandable multi-item sections + icons.
 * Single-item groups render as a plain link (no redundant group title).
 */
export default function RestaurantAdminNav({ groups, t }) {
  const { pathname } = useLocation();

  const activeGroupKey = useMemo(() => {
    const hit = groups.find((group) => group.items.length > 1 && groupHasActive(group, pathname));
    return hit?.key ?? null;
  }, [groups, pathname]);

  const [openKey, setOpenKey] = useState(activeGroupKey);

  useEffect(() => {
    if (activeGroupKey) setOpenKey(activeGroupKey);
  }, [activeGroupKey]);

  return (
    <nav className="rst-shell__links">
      {groups.map((group) => {
        if (group.items.length === 1) {
          return (
            <div key={group.key} className="rst-shell__group rst-shell__group--solo">
              <NavItemLink item={group.items[0]} t={t} />
            </div>
          );
        }

        const GroupIcon = RST_NAV_GROUP_ICONS[group.key];
        const open = openKey === group.key;
        const active = groupHasActive(group, pathname);

        return (
          <div
            key={group.key}
            className={`rst-shell__group${open ? ' is-open' : ''}${active ? ' is-active' : ''}`}
          >
            <button
              type="button"
              className="rst-shell__group-toggle"
              aria-expanded={open}
              onClick={() => setOpenKey((prev) => (prev === group.key ? null : group.key))}
            >
              <span className="rst-shell__group-toggle-main">
                {GroupIcon ? <GroupIcon size={16} strokeWidth={2.2} className="rst-shell__ico" aria-hidden /> : null}
                <span>{t(`rst.nav.group.${group.key}`)}</span>
              </span>
              <ChevronDown size={16} strokeWidth={2.2} className="rst-shell__chevron" aria-hidden />
            </button>

            {open ? (
              <div className="rst-shell__group-links">
                {group.items.map((item) => (
                  <NavItemLink key={item.to} item={item} t={t} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
