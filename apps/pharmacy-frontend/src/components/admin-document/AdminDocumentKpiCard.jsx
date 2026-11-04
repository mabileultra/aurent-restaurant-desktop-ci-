export default function AdminDocumentKpiCard({ label, value, hint, tone = 'default' }) {
  return (
    <article className="admin-doc-kpi">
      <p className="admin-doc-kpi__label">{label}</p>
      <p className={`admin-doc-kpi__value admin-doc-kpi__value--${tone}`}>{value}</p>
      {hint ? <p className="admin-doc-kpi__hint">{hint}</p> : null}
    </article>
  );
}
