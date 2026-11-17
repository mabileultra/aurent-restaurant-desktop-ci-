import React from 'react';
import { Inbox } from 'lucide-react';
import clsx from 'clsx';

/**
 * Consistent empty state for carts, tables, charts and reports.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
}) {
  return (
    <div
      className={clsx(
        'ui-empty-state',
        compact ? 'py-6 px-3' : 'py-10 px-4',
        className,
      )}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        <Icon size={20} strokeWidth={1.75} aria-hidden />
      </span>
      {title ? <p className="text-sm font-medium text-ink">{title}</p> : null}
      {description ? <p className="max-w-sm text-xs text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
