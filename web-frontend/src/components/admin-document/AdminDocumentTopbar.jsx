import { Link } from 'react-router-dom';

export default function AdminDocumentTopbar({ backTo, parentLabel, currentLabel }) {
  return (
    <div className="admin-doc__topbar">
      <Link to={backTo} className="admin-doc__back" aria-label={parentLabel}>
        ←
      </Link>
      <Link to={backTo} className="admin-doc__crumb-link">
        {parentLabel}
      </Link>
      <span className="admin-doc__crumb-sep" aria-hidden>
        /
      </span>
      <span className="admin-doc__crumb-current">{currentLabel}</span>
    </div>
  );
}
