import { Link } from 'react-router-dom';
import '../styles/pharmacy-stock.css';

export function PharmacyStockBackLink({ to, children, iconOnly = false }) {
  return (
    <div className="inline-flex items-center gap-2">
      <Link to={to} className="pharmacy-stock__back" aria-label={typeof children === 'string' ? children : 'Back'}>
        <span aria-hidden>←</span>
      </Link>
      {!iconOnly && children ? (
        <span className="pharmacy-stock__back-label">{children}</span>
      ) : null}
    </div>
  );
}

export function PharmacyStatusBadge({ status, t }) {
  const posted = String(status || '').toUpperCase() === 'POSTED';
  return (
    <span className={`pharmacy-stock__badge pharmacy-stock__badge--${posted ? 'posted' : 'draft'}`}>
      {posted ? t('pharmacyStock.statusPosted') : t('pharmacyStock.statusDraft')}
    </span>
  );
}

export default function PharmacyStockLayout({
  backTo,
  backLabel,
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
  backIconOnly = false,
}) {
  return (
    <div className={`admin-page admin-page--full pharmacy-stock flex min-h-0 flex-col ${className}`.trim()}>
      <header className="pharmacy-stock__top">
        <div className="pharmacy-stock__top-main">
          {backTo ? (
            <PharmacyStockBackLink to={backTo} iconOnly={backIconOnly}>
              {backLabel}
            </PharmacyStockBackLink>
          ) : null}
          <div className="pharmacy-stock__heading">
            <div className="pharmacy-stock__title-row">
              <h1 className="pharmacy-stock__title">{title}</h1>
              {badge}
            </div>
            {subtitle ? <p className="pharmacy-stock__subtitle">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="pharmacy-stock__actions">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
