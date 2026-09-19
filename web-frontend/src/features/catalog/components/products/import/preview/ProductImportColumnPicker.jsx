import { Columns3 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PRODUCT_IMPORT_COLUMN_DEFS } from '../../../../utils/productImportColumns';
import './product-import-column-picker.css';

export default function ProductImportColumnPicker({ t, visibleColumns, onToggle }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="product-import-column-picker" ref={rootRef}>
      <button
        type="button"
        className="product-import-column-picker__btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Columns3 size={16} />
        {t('products.import.columns')}
      </button>
      {open ? (
        <div className="product-import-column-picker__menu" role="menu">
          {PRODUCT_IMPORT_COLUMN_DEFS.map((col) => (
            <label key={col.id} className="product-import-column-picker__item">
              <input
                type="checkbox"
                checked={Boolean(visibleColumns[col.id])}
                disabled={col.sticky}
                onChange={() => onToggle(col.id)}
              />
              <span>{t(col.labelKey)}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
