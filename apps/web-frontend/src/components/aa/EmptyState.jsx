import React from 'react';
import clsx from 'clsx';
import { Inbox } from 'lucide-react';

/**
 * Aurent Admin — EmptyState bo‘sh holat komponenti.
 * aa-components.css dagi .aa-empty sinflaridan foydalanadi.
 */
export default function EmptyState({
  icon,
  title,
  text,
  actions,
  className,
  ...props
}) {
  return (
    <div className={clsx('aa-empty', className)} {...props}>
      <div className="aa-empty__icon" aria-hidden="true">
        {icon || <Inbox className="aa-icon aa-icon--lg" />}
      </div>
      {title ? <h4 className="aa-empty__title">{title}</h4> : null}
      {text ? <p className="aa-empty__text">{text}</p> : null}
      {actions ? <div className="aa-empty__actions">{actions}</div> : null}
    </div>
  );
}
