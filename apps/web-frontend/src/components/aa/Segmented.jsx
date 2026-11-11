import React from 'react';
import clsx from 'clsx';

/**
 * Aurent Admin — Segmented boshqaruvi.
 * aa-components.css dagi .aa-seg sinflaridan foydalanadi.
 */
export default function Segmented({
  options = [],
  value,
  onChange,
  accent = 'brand',
  className,
  'aria-label': ariaLabel = 'Segment tanlovi',
  ...props
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={clsx('aa-seg', accent === 'analytics' && 'aa-seg--analytics', className)}
      {...props}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange?.(opt.value)}
            className="aa-seg__btn"
          >
            {opt.label}
            {opt.count !== undefined && opt.count !== null ? (
              <span className="ml-1.5 aa-num">({opt.count})</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
