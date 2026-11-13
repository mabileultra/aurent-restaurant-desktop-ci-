import React from 'react';
import clsx from 'clsx';

/**
 * Aurent Admin — FilterChip komponenti.
 * aa-components.css dagi .aa-chip sinflaridan foydalanadi.
 */
export default function FilterChip({
  pressed = false,
  onToggle,
  count,
  accent = 'brand',
  children,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={clsx(
        'aa-chip',
        accent === 'analytics' && 'aa-chip--analytics',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {count !== undefined && count !== null ? (
        <span className="aa-chip__count">{count}</span>
      ) : null}
    </button>
  );
}
