export default function AdminDocumentHeader({ title, badge, subtitle, actions }) {
  return (
    <header className="admin-doc__header">
      <div>
        <div className="admin-doc__title-row">
          <h1 className="admin-doc__title">{title}</h1>
          {badge}
        </div>
        {subtitle ? <p className="admin-doc__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="admin-doc__actions">{actions}</div> : null}
    </header>
  );
}
