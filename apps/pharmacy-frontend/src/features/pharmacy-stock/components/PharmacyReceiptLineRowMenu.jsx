import { useEffect, useRef, useState } from 'react';
import { FileText, MoreVertical, Package, Pencil, Trash2 } from 'lucide-react';
import '../styles/pharmacy-receipt-document-menu.css';

/** ⋯ в строке: о товаре / приход / изменить / удалить. */
export default function PharmacyReceiptLineRowMenu({
  t,
  onAboutProduct,
  onOpenReceipt,
  onEdit,
  onDelete,
  deleteDisabled = false,
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
        className="pharmacy-receipt-document-menu__trigger pharmacy-receipt-document-menu__trigger--row"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('pharmacyStock.lineRowMenu')}
        title={t('pharmacyStock.lineRowMenu')}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical size={16} strokeWidth={2.2} aria-hidden />
      </button>
      {open ? (
        <div className="pharmacy-receipt-document-menu__list pharmacy-receipt-document-menu__list--row" role="menu">
          {onAboutProduct ? (
            <button type="button" role="menuitem" onClick={() => run(onAboutProduct)}>
              <Package size={15} strokeWidth={2.2} aria-hidden />
              {t('pharmacyStock.aboutProduct')}
            </button>
          ) : null}
          {onOpenReceipt ? (
            <button type="button" role="menuitem" onClick={() => run(onOpenReceipt)}>
              <FileText size={15} strokeWidth={2.2} aria-hidden />
              {t('pharmacyStock.openSourceReceipt')}
            </button>
          ) : null}
          {onEdit ? (
            <button type="button" role="menuitem" onClick={() => run(onEdit)}>
              <Pencil size={15} strokeWidth={2.2} aria-hidden />
              {t('common.edit')}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              role="menuitem"
              className="is-danger"
              disabled={deleteDisabled}
              onClick={() => run(onDelete)}
            >
              <Trash2 size={15} strokeWidth={2.2} aria-hidden />
              {t('common.delete')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
