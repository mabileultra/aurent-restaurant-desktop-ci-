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
  pill = false,
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
        const usePill = pill || opt.pill;

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
              usePill ? (
                <span
                  className={clsx(
                    'ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-aa-full text-[11px] font-semibold tabular-nums transition-colors',
                    isSelected
                      ? 'bg-aa-brand-soft text-aa-brand'
                      : 'bg-aa-surface-sunken text-aa-ink-muted'
                  )}
                >
                  {opt.count}
                </span>
              ) : (
                <span className="ml-1.5 aa-num">({opt.count})</span>
              )
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
