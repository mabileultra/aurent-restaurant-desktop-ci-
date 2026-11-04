import { useMemo } from 'react';

const PREVIEW_ROLES = [
  'NAME', 'QTY', 'PURCHASE', 'MARKUP', 'VAT_RATE', 'RETAIL', 'BATCH', 'EXPIRY',
];

/** Живой превью: какая роль → какая ячейка первой строки (смена колонки сразу видна). */
export default function PharmacyReceiptImportRolePreview({ t, roles, rows }) {
  const sample = rows?.[0];
  const items = useMemo(() => {
    if (!sample) return [];
    return PREVIEW_ROLES.map((role) => {
      const index = Object.entries(roles || {}).find(([, r]) => r === role)?.[0];
      if (index == null) return null;
      const col = Number(index);
      const value = sample[col];
      return {
        role,
        col: col + 1,
        value: value == null || value === '' ? '—' : String(value),
      };
    }).filter(Boolean);
  }, [roles, sample]);

  if (!items.length) return null;

  return (
    <div className="pharmacy-stock__import-preview" aria-live="polite">
      <p className="pharmacy-stock__import-preview-title">{t('pharmacyStock.importRolePreview')}</p>
      <ul className="pharmacy-stock__import-preview-list">
        {items.map((item) => (
          <li key={item.role} className="pharmacy-stock__import-preview-item">
            <span className="pharmacy-stock__import-preview-role">
              {t(`pharmacyStock.importRole.${item.role}`)}
            </span>
            <span className="pharmacy-stock__import-preview-col">#{item.col}</span>
            <span
              className={
                item.role === 'RETAIL'
                  ? 'pharmacy-stock__import-preview-value is-retail'
                  : 'pharmacy-stock__import-preview-value'
              }
            >
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
