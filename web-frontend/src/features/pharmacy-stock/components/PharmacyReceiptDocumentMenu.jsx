import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import '../styles/pharmacy-receipt-document-menu.css';

export default function PharmacyReceiptDocumentMenu({
  t,
  canEdit,
  onEdit,
  onDelete,
  onClose,
  deleteDisabled,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (action) => {
    setOpen(false);
    action?.();
  };

  return (
    <div className="pharmacy-receipt-document-menu" ref={rootRef}>
      <button
        type="button"
        className="pharmacy-receipt-document-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('pharmacyStock.documentMenu')}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical size={18} strokeWidth={2.2} aria-hidden />
      </button>
      {open ? (
        <div className="pharmacy-receipt-document-menu__list" role="menu">
          {canEdit ? (
            <button type="button" role="menuitem" onClick={() => run(onEdit)}>
              <Pencil size={15} strokeWidth={2.2} aria-hidden />
              {t('pharmacyStock.editDocument')}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            disabled={deleteDisabled}
            onClick={() => run(onDelete)}
          >
            <Trash2 size={15} strokeWidth={2.2} aria-hidden />
            {t('pharmacyStock.deleteDocument')}
          </button>
          <button type="button" role="menuitem" onClick={() => run(onClose)}>
            <X size={15} strokeWidth={2.2} aria-hidden />
            {t('common.close')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
