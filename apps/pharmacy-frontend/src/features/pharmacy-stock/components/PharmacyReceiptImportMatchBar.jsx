import { summarizePharmacyImportMatch } from '../utils/summarizePharmacyImportMatch';
import '../styles/pharmacy-import-match-bar.css';

const FILTERS = [
  { id: 'all', countKey: 'total', tone: 'all' },
  { id: 'found', countKey: 'found', tone: 'found' },
  { id: 'partial', countKey: 'partial', tone: 'partial' },
  { id: 'missing', countKey: 'missing', tone: 'missing' },
];

export default function PharmacyReceiptImportMatchBar({
  t,
  items,
  filter,
  onFilter,
  onSelectFound,
  onSelectAll,
  onClear,
}) {
  const summary = summarizePharmacyImportMatch(items);
  if (!summary.total) return null;

  return (
    <section className="pharmacy-import-match-bar">
      <div className="pharmacy-import-match-bar__filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`pharmacy-import-match-bar__chip is-${item.tone}${filter === item.id ? ' is-active' : ''}`}
            onClick={() => onFilter(item.id)}
          >
            <span>{t(`pharmacyStock.importMatch.${item.id}`)}</span>
            <strong>{summary[item.countKey]}</strong>
          </button>
        ))}
      </div>
      <p className="pharmacy-import-match-bar__hint">{t('pharmacyStock.importMatch.hint')}</p>
      <div className="pharmacy-import-match-bar__actions">
        <button type="button" onClick={onSelectFound}>
          {t('pharmacyStock.importMatch.selectFound')}
        </button>
        <button type="button" onClick={onSelectAll}>
          {t('pharmacyStock.importMatch.selectAll')}
        </button>
        <button type="button" onClick={onClear}>
          {t('pharmacyStock.importMatch.clear')}
        </button>
        <span className="pharmacy-import-match-bar__picked">
          {t('pharmacyStock.importMatch.selected', { count: summary.selected })}
        </span>
      </div>
    </section>
  );
}
