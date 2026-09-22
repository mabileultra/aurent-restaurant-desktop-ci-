import { useEffect, useRef, useState } from 'react';
import { Columns3 } from 'lucide-react';
import '../styles/report-column-picker.css';

export default function ReportColumnPicker({ t, columnDefs, visible, onToggle }) {
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
    <div className="rst-report-cols" ref={rootRef}>
      <button
        type="button"
        className="rst-report-cols__btn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Columns3 size={16} aria-hidden />
        {t('rst.nomenclature.columns')}
      </button>
      {open ? (
        <div className="rst-report-cols__menu" role="menu">
          {columnDefs.map((col) => (
            <label key={col.id} className="rst-report-cols__item">
              <input
                type="checkbox"
                checked={Boolean(visible[col.id])}
                disabled={Boolean(col.locked)}
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
