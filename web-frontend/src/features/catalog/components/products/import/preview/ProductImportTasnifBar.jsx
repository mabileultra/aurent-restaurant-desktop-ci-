import { summarizeProductImportTasnif } from '../../../../utils/classifyProductImportTasnif';
import { countProductImportMarked } from '../../../../utils/countProductImportMarked';
import './product-import-tasnif-bar.css';

const FILTERS = [
  { id: 'all', countKey: 'total', tone: 'all' },
  { id: 'found', countKey: 'found', tone: 'found' },
  { id: 'partial', countKey: 'partial', tone: 'partial' },
  { id: 'missing', countKey: 'missing', tone: 'missing' },
  { id: 'duplicate', countKey: 'duplicate', tone: 'duplicate' },
];

export default function ProductImportTasnifBar({
  t,
  rows,
  editable,
  tasnifByRow,
  filter,
  onFilter,
  verifying,
  verifyProgress,
  onVerify,
}) {
  const summary = summarizeProductImportTasnif(rows, tasnifByRow);
  const marked = countProductImportMarked(rows, editable, tasnifByRow);
  if (!summary.total) return null;

  return (
    <section className="product-import-tasnif-bar">
      <div className="product-import-tasnif-bar__filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`product-import-tasnif-bar__chip is-${item.tone}${filter === item.id ? ' is-active' : ''}`}
            onClick={() => onFilter(item.id)}
          >
            <span>{t(`products.import.tasnif.${item.id}`)}</span>
            <strong>{summary[item.countKey] ?? 0}</strong>
          </button>
        ))}
        <span className="product-import-tasnif-bar__chip is-marked">
          <span>{t('products.import.tasnif.marked')}</span>
          <strong>{marked}</strong>
        </span>
      </div>
      <p className="product-import-tasnif-bar__hint">{t('products.import.tasnif.hint')}</p>
      <div className="product-import-tasnif-bar__actions">
        <button type="button" onClick={onVerify} disabled={verifying}>
          {verifying
            ? t('products.import.tasnif.checking', {
                done: verifyProgress?.done ?? 0,
                total: verifyProgress?.total ?? 0,
              })
            : t('products.import.tasnif.verify')}
        </button>
      </div>
    </section>
  );
}
