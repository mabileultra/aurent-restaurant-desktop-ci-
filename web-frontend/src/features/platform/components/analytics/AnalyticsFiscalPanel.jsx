import {
  formatAnalyticsCount,
  formatAnalyticsMoney,
} from '../../utils/formatAnalyticsMoney';

export default function AnalyticsFiscalPanel({ t, data }) {
  const kpi = data?.kpi || {};
  const stores = data?.byStore || [];

  return (
    <div className="pa-fiscal-page">
      {data?.approximate ? (
        <p className="pa-muted" role="note">{t('platform.analytics.fiscal.approximateHint')}</p>
      ) : null}
      {!kpi.vatAvailable ? (
        <p className="pa-muted" role="note">{t('platform.analytics.fiscal.vatUnavailable')}</p>
      ) : null}

      <div className="pa-kpi-grid">
        <article className="pa-kpi">
          <p className="pa-kpi__label">{t('platform.analytics.fiscal.fiscalTurnover')}</p>
          <p className="pa-kpi__value">{formatAnalyticsMoney(kpi.fiscalTurnover, t)}</p>
        </article>
        <article className="pa-kpi">
          <p className="pa-kpi__label">{t('platform.analytics.fiscal.fiscalReceipts')}</p>
          <p className="pa-kpi__value">{formatAnalyticsCount(kpi.fiscalReceipts)}</p>
        </article>
        <article className="pa-kpi">
          <p className="pa-kpi__label">{t('platform.analytics.kpi.avgCheck')}</p>
          <p className="pa-kpi__value">{formatAnalyticsMoney(kpi.avgCheck, t)}</p>
        </article>
        <article className="pa-kpi">
          <p className="pa-kpi__label">{t('platform.analytics.fiscal.fiscalReturns')}</p>
          <p className="pa-kpi__value">{formatAnalyticsMoney(kpi.returnsAmount, t)}</p>
          <p className="pa-kpi__sub">{formatAnalyticsCount(kpi.returnsReceipts)} {t('platform.analytics.kpi.receipts').toLowerCase()}</p>
        </article>
        <article className="pa-kpi">
          <p className="pa-kpi__label">{t('platform.analytics.fiscal.cancelled')}</p>
          <p className="pa-kpi__value">{formatAnalyticsCount(kpi.cancelledReceipts)}</p>
        </article>
        <article className="pa-kpi">
          <p className="pa-kpi__label">{t('platform.analytics.fiscal.vat')}</p>
          <p className="pa-kpi__value">
            {kpi.vatAvailable ? formatAnalyticsMoney(kpi.vat, t) : '—'}
          </p>
        </article>
      </div>

      <section className="pa-card">
        <header className="pa-card__head">
          <h3 className="pa-card__title">{t('platform.analytics.fiscal.byStoreTitle')}</h3>
        </header>
        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr>
                <th>{t('platform.analytics.stores.colStore')}</th>
                <th>{t('platform.analytics.fiscal.fiscalTurnover')}</th>
                <th>{t('platform.analytics.kpi.receipts')}</th>
                <th>{t('platform.analytics.fiscal.fiscalReturns')}</th>
                <th>{t('platform.analytics.fiscal.cancelled')}</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="pa-muted">{t('platform.analytics.fiscal.empty')}</td>
                </tr>
              ) : stores.map((s) => (
                <tr key={s.storeId ?? s.name}>
                  <td>{s.name}</td>
                  <td>{formatAnalyticsMoney(s.turnover, t)}</td>
                  <td>{formatAnalyticsCount(s.receipts)}</td>
                  <td>{formatAnalyticsMoney(s.returnsAmount, t)}</td>
                  <td>{formatAnalyticsCount(s.cancelledReceipts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
