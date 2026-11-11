import React from 'react';
import clsx from 'clsx';

/**
 * Aurent Admin — Card komponenti.
 * aa-components.css dagi .aa-card sinflaridan foydalanadi.
 */
export default function Card({
  title,
  subtitle,
  actions,
  footer,
  children,
  bodyFlush = false,
  className,
  ...props
}) {
  const hasHead = title || subtitle || actions;

  return (
    <div className={clsx('aa-card', className)} {...props}>
      {hasHead ? (
        <div className={clsx('aa-card__head', bodyFlush && 'aa-card__head--flush')}>
          <div>
            {title ? <h3 className="aa-card__title">{title}</h3> : null}
            {subtitle ? <p className="aa-card__sub">{subtitle}</p> : null}
          </div>
          {actions ? <div className="aa-card__actions">{actions}</div> : null}
        </div>
      ) : null}

      <div className={bodyFlush ? undefined : 'aa-card__body'}>
        {children}
      </div>

      {footer ? <div className="aa-card__foot">{footer}</div> : null}
    </div>
  );
}
