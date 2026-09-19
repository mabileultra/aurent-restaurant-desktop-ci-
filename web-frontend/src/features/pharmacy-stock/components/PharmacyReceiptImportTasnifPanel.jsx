import { summarizePharmacyImportTasnif } from '../utils/summarizePharmacyImportTasnif';
import '../styles/pharmacy-import-tasnif.css';

export default function PharmacyReceiptImportTasnifPanel({ t, items }) {
  const summary = summarizePharmacyImportTasnif(items);
  if (!summary.total) return null;

  return (
    <section className="pharmacy-import-tasnif" aria-live="polite">
      <div className="pharmacy-import-tasnif__head">
        <span className="pharmacy-import-tasnif__badge">{t('pharmacyStock.importTasnif.badge')}</span>
        <p className="pharmacy-import-tasnif__title">{t('pharmacyStock.importTasnif.title')}</p>
      </div>
      <p className="pharmacy-import-tasnif__lead">
        {t('pharmacyStock.importTasnif.lead', { count: summary.total })}
      </p>
      <ul className="pharmacy-import-tasnif__stats">
        <li>{t('pharmacyStock.importTasnif.marked', { count: summary.marked })}</li>
        <li>{t('pharmacyStock.importTasnif.found', { count: summary.found })}</li>
        <li>{t('pharmacyStock.importTasnif.manual', { count: summary.manual })}</li>
        <li>{t('pharmacyStock.importTasnif.pack', { count: summary.pack })}</li>
        <li>{t('pharmacyStock.importTasnif.rx', { count: summary.rx })}</li>
      </ul>
    </section>
  );
}
