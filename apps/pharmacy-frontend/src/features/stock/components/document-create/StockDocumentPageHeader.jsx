import { Link } from 'react-router-dom';

export default function StockDocumentPageHeader({ backTo, backLabel, title, subtitle }) {
  return (
    <div>
      <Link to={backTo} className="admin-link text-sm">
        ← {backLabel}
      </Link>
      <h1 className="admin-page-title mt-2 text-xl">{title}</h1>
      {subtitle ? <p className="admin-page-subtitle text-sm">{subtitle}</p> : null}
    </div>
  );
}
