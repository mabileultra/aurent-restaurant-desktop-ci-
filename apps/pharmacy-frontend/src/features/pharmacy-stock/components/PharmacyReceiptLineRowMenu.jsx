import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, MoreVertical, Package, Pencil, Trash2 } from 'lucide-react';
import '../styles/pharmacy-receipt-document-menu.css';

/** ⋯ в строке: о товаре / приход / изменить / удалить. Portal — не режется overflow таблицы. */
export default function PharmacyReceiptLineRowMenu({
  t,
  onAboutProduct,
  onOpenReceipt,
  onEdit,
  onDelete,
  deleteDisabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return undefined;
    }
    const place = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 184;
      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8,
      );
      const openUp = rect.bottom + 160 > window.innerHeight;
      setCoords({
        left,
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)
        && !triggerRef.current?.contains(event.target)) {
        setOpen(false);
      }
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

  const menu = open && coords
    ? createPortal(
      <div
        ref={rootRef}
        className="pharmacy-receipt-document-menu__list pharmacy-receipt-document-menu__list--portal"
        role="menu"
        style={{
          position: 'fixed',
          left: coords.left,
          top: coords.top,
          bottom: coords.bottom,
          right: 'auto',
        }}
      >
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
      </div>,
      document.body,
    )
    : null;

  return (
    <div className="pharmacy-receipt-document-menu">
      <button
        ref={triggerRef}
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
      {menu}
    </div>
  );
}
