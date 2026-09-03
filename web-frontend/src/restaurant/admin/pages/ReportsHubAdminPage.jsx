import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/analytics-admin.css';

const REPORT_CARDS = [
  { to: '/rst/admin/reports/sales', key: 'reportsSalesCard', hint: 'reportsSalesHint' },
  { to: '/rst/admin/reports/inventories', key: 'reportsInventoriesCard', hint: 'reportsInventoriesHint' },
  { to: '/rst/admin/reports/balances', key: 'reportsBalancesCard', hint: 'reportsBalancesHint' },
  { to: '/rst/admin/reports/low', key: 'reportsLowCard', hint: 'reportsLowHint' },
];

export default function ReportsHubAdminPage() {
  const { t } = useTranslation();

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.reportsTitle')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.reportsHubSubtitle')}</p>
        </div>
      </div>
      <div className="rst-report-hub">
        {REPORT_CARDS.map((card) => (
          <Link key={card.to} to={card.to} className="rst-report-hub__card">
            <strong>{t(`rst.admin.${card.key}`)}</strong>
            <span>{t(`rst.admin.${card.hint}`)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
