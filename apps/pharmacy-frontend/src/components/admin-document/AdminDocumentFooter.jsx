export default function AdminDocumentFooter({ status, total, actions }) {
  return (
    <footer className="admin-doc-footer">
      <div className="admin-doc-footer__status">{status}</div>
      <div className="admin-doc-footer__actions">
        {total}
        {actions}
      </div>
    </footer>
  );
}
