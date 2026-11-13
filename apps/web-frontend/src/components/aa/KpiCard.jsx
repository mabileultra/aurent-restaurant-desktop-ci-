import React from 'react';
import clsx from 'clsx';
import Skeleton from './Skeleton';

/**
 * Aurent Admin — KpiCard ko‘rsatkich kartasi.
 * aa-components.css dagi .aa-kpi sinflaridan foydalanadi.
 */
export default function KpiCard({
  label,
  value,
  unit,
  size = 'md',
  delta,
  meta,
  split,
  loading = false,
  className,
  ...props
}) {
  const displayValue = value !== undefined && value !== null && value !== '' ? value : '—';

  return (
    <div className={clsx('aa-kpi', className)} {...props}>
      <span className="aa-kpi__label">{label}</span>

      {loading ? (
        <Skeleton variant="metric" width="65%" />
      ) : (
        <div className={clsx('aa-kpi__value', size === 'lg' && 'aa-kpi__value--lg')}>
          <span>{displayValue}</span>
          {unit ? <span className="aa-kpi__unit">{unit}</span> : null}
        </div>
      )}

      {split && split.length > 0 ? (
        <div className="aa-kpi__bar" aria-hidden="true">
          {split.map((item, idx) => (
            <span
              key={idx}
              style={{
                width: `${item.value}%`,
                backgroundColor: item.tone ? `var(--aa-${item.tone})` : 'var(--aa-brand)',
              }}
              title={item.label}
            />
          ))}
        </div>
      ) : null}

      {delta || meta ? (
        <div className="aa-kpi__meta">
          {delta ? (
            <span
              className={clsx(
                'aa-delta',
                delta.direction === 'up' && 'aa-delta--up',
                delta.direction === 'down' && 'aa-delta--down'
              )}
            >
              {delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : ''}
              {delta.value ? ` ${delta.value}` : null}
            </span>
          ) : null}
          {delta?.text ? <span>{delta.text}</span> : null}
          {meta ? <span>{meta}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
