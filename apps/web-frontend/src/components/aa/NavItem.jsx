import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

/**
 * Aurent Admin — NavItem sidebar menyu elementi.
 * aa-components.css dagi .aa-nav__item sinflaridan foydalanadi.
 */
export default function NavItem({
  icon,
  label,
  to,
  count,
  accent = 'brand',
  active,
  as: Component,
  className,
  children,
  ...props
}) {
  const isAnalytics = accent === 'analytics';

  if (!Component && to) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          clsx(
            'aa-nav__item',
            isAnalytics && 'aa-nav__item--analytics',
            className
          )
        }
        {...props}
      >
        {icon ? (
          <span className="aa-icon flex items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="aa-nav__label">{label || children}</span>
        {count !== undefined && count !== null ? (
          <span className="aa-nav__count">{count}</span>
        ) : null}
      </NavLink>
    );
  }

  const Tag = Component || (to ? 'a' : 'button');
  const buttonType = Tag === 'button' ? (props.type || 'button') : undefined;

  return (
    <Tag
      type={buttonType}
      href={to}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'aa-nav__item',
        isAnalytics && 'aa-nav__item--analytics',
        className
      )}
      {...props}
    >
      {icon ? (
        <span className="aa-icon flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="aa-nav__label">{label || children}</span>
      {count !== undefined && count !== null ? (
        <span className="aa-nav__count">{count}</span>
      ) : null}
    </Tag>
  );
}
