import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

/**
 * Aurent Admin — PageHeader sahifa sarlavhasi.
 * aa-components.css dagi .aa-pagehead va .aa-crumbs sinflaridan foydalanadi.
 */
export default function PageHeader({
  breadcrumbs = [],
  title,
  meta,
  actions,
  className,
  ...props
}) {
  return (
    <div className={clsx('aa-pagehead', className)} {...props}>
      <div className="aa-pagehead__main">
        {breadcrumbs.length > 0 ? (
          <nav aria-label="Yo‘l" className="aa-crumbs">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;

              return (
                <React.Fragment key={crumb.to || crumb.label || idx}>
                  {idx > 0 ? <span className="aa-muted" aria-hidden="true">›</span> : null}
                  {isLast ? (
                    <span aria-current="page">{crumb.label}</span>
                  ) : crumb.to ? (
                    <Link to={crumb.to}>{crumb.label}</Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        ) : null}

        {title ? <h1 className="aa-pagehead__title">{title}</h1> : null}

        {meta ? <div className="aa-pagehead__meta">{meta}</div> : null}
      </div>

      {actions ? <div className="aa-pagehead__actions">{actions}</div> : null}
    </div>
  );
}
