import { useEffect, useRef, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PHARMACY_CATALOG_COLUMN_DEFS,
  saveCatalogColumnVisibility,
} from '../constants/pharmacyCatalogColumns';

/**
 * Настройки видимости колонок каталога (ТЗ §2).
 */
export default function PharmacyCatalogColumnMenu({ visibility, onChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const toggle = (id) => {
    const next = { ...visibility, [id]: !visibility[id] };
    saveCatalogColumnVisibility(next);
    onChange(next);
  };

  return (
    <div className="pharmacy-catalog-toolbar__cols" ref={rootRef}>
      <button
        type="button"
        className="pharmacy-catalog-toolbar__btn"
        aria-expanded={open}
        title={t('pharmacyCashier.catalogColumns')}
        onClick={() => setOpen((v) => !v)}
      >
        <Settings2 size={14} strokeWidth={2.25} aria-hidden />
        <span>{t('pharmacyCashier.catalogColumns')}</span>
      </button>
      {open ? (
        <div className="pharmacy-catalog-cols-pop" role="dialog" aria-label={t('pharmacyCashier.catalogColumns')}>
          <ul className="pharmacy-catalog-cols-pop__list">
            {PHARMACY_CATALOG_COLUMN_DEFS.map((col) => (
              <li key={col.id}>
                <label className="pharmacy-catalog-cols-pop__item">
                  <input
                    type="checkbox"
                    checked={visibility[col.id] !== false}
                    onChange={() => toggle(col.id)}
                  />
                  <span>{t(col.labelKey)}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
