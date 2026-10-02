import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Receipt,
  Percent,
} from 'lucide-react';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/analytics-admin.css';

const SALES_LINKS = [
  {
    to: '/rst/admin/reports/sales',
    titleKey: 'reportsSalesCard',
    hintKey: 'reportsSalesHint',
    icon: Receipt,
  },
  {
    to: '/rst/admin/reports/waiter-commission',
    titleKey: 'reportsCommissionCard',
    hintKey: 'reportsCommissionHint',
    icon: Percent,
  },
];

function ReportsHubSection({ title, subtitle, links, t }) {
  if (links.length === 0) return null;

  return (
    <section className="rst-report-hub__section">
      <div className="rst-report-hub__section-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="rst-report-hub__grid">
        {links.map(({ to, titleKey, hintKey, icon: Icon }) => (
          <Link key={to} to={to} className="rst-report-hub__link">
            <span className="rst-report-hub__icon" aria-hidden>
              <Icon size={20} />
            </span>
            <span className="rst-report-hub__copy">
              <strong>{t(`rst.admin.${titleKey}`)}</strong>
              <span>{t(`rst.admin.${hintKey}`)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ReportsHubAdminPage() {
  const { t } = useTranslation();

  return (
    <section className="rst-report-hub">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.reportsTitle')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.reportsHubSubtitle')}</p>
        </div>
      </div>

      <ReportsHubSection
        title={t('reportsHub.salesSection')}
        subtitle={t('reportsHub.salesSectionHint')}
        links={SALES_LINKS}
        t={t}
      />
    </section>
  );
}
