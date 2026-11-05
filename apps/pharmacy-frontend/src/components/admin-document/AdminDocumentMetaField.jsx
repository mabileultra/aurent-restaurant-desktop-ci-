export default function AdminDocumentMetaField({ label, required = false, children }) {
  return (
    <div className="admin-doc-meta__field">
      <span className="admin-doc-meta__label">
        {label}
        {required ? <span className="admin-doc-meta__req"> *</span> : null}
      </span>
      {children}
    </div>
  );
}
