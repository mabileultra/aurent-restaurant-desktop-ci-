import { useTranslation } from 'react-i18next';
import '../styles/report-store-select.css';

export default function ReportStoreSelect({ stores = [], value, onChange }) {
  const { t } = useTranslation();
  return (
    <label className="rst-report-store">
      <span className="rst-report-store__label">{t('stockReports.colStore')}</span>
      <select
        className="rst-report-store__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t('stockReports.allStores')}</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </label>
  );
}
