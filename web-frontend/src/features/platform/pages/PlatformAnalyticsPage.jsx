import '../../../styles/platform/tax-analytics.css';
import { PageLayout } from '../../../components/ui';
import { useTaxAnalyticsPage } from '../hooks/useTaxAnalyticsPage';

function fmtNum(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('ru-RU');
}

function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} трлн`;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млрд`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`;
  return `${v.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} сум`;
}

function Delta({ value }) {
  if (value == null) return <span className="ta-neutral">—</span>;
  const n = Number(value);
  const cls = n > 0 ? 'ta-up' : n < 0 ? 'ta-down' : 'ta-neutral';
  const arrow = n > 0 ? '↑' : n < 0 ? '↓' : '';
  return <span className={cls}>{arrow} {Math.abs(n).toLocaleString('ru-RU')}%</span>;
}

function ShareBadge({ value, tone = 'green' }) {
  if (value == null) return <span className="ta-muted">—</span>;
  return <span className={`ta-badge ta-badge-${tone}`}>{Number(value).toLocaleString('ru-RU')}%</span>;
}

export default function PlatformAnalyticsPage() {
  const p = useTaxAnalyticsPage();
  const { t, overview, results } = p;
  const kpi = overview?.kpi;

  return (
    <PageLayout
      className="ta-page"
      spacing="space-y-4"
      title={t('platform.analytics.title')}
      subtitle={t('platform.analytics.subtitle')}
      actions={(
        <div className="ta-period">
          {p.periods.map((key) => (
            <button
              key={key}
              type="button"
              className={`ta-period__btn${p.period === key ? ' is-active' : ''}`}
              onClick={() => p.setPeriod(key)}
            >
              {t(`platform.analytics.periods.${key}`)}
            </button>
          ))}
          <input
            type="date"
            value={p.customFrom}
            onChange={(e) => { p.setCustomFrom(e.target.value); p.setPeriod('custom'); }}
            className="ta-period__btn"
          />
          <span className="ta-muted">—</span>
          <input
            type="date"
            value={p.customTo}
            onChange={(e) => { p.setCustomTo(e.target.value); p.setPeriod('custom'); }}
            className="ta-period__btn"
          />
        </div>
      )}
    >
      {p.overviewError ? <p className="ta-error">{t('platform.analytics.loadFailed')}</p> : null}

      <div className="ta-kpi-grid">
        <div className="ta-kpi">
          <p className="ta-kpi__label">{t('platform.analytics.kpi.totalEnterprises')}</p>
          <p className="ta-kpi__value">{p.overviewLoading ? '…' : fmtNum(kpi?.totalEnterprises)}</p>
        </div>
        <div className="ta-kpi">
          <p className="ta-kpi__label">{t('platform.analytics.kpi.connected')}</p>
          <p className="ta-kpi__value">{p.overviewLoading ? '…' : fmtNum(kpi?.connected)}</p>
          <div className="ta-kpi__meta">
            <ShareBadge value={kpi?.connectedSharePct} tone="green" />
          </div>
        </div>
        <div className="ta-kpi">
          <p className="ta-kpi__label">{t('platform.analytics.kpi.notConnected')}</p>
          <p className="ta-kpi__value">{p.overviewLoading ? '…' : fmtNum(kpi?.notConnected)}</p>
          <div className="ta-kpi__meta">
            <ShareBadge value={kpi?.notConnectedSharePct} tone="red" />
          </div>
        </div>
        <div className="ta-kpi">
          <p className="ta-kpi__label">{t('platform.analytics.kpi.totalTurnover')}</p>
          <p className="ta-kpi__value">{p.overviewLoading ? '…' : fmtMoney(kpi?.totalTurnover)}</p>
          <div className="ta-kpi__meta"><Delta value={kpi?.totalTurnoverDeltaPct} /></div>
        </div>
        <div className="ta-kpi">
          <p className="ta-kpi__label">{t('platform.analytics.kpi.newConnections')}</p>
          <p className="ta-kpi__value">{p.overviewLoading ? '…' : fmtNum(kpi?.newConnections)}</p>
          <div className="ta-kpi__meta"><Delta value={kpi?.newConnectionsDeltaPct} /></div>
        </div>
        <div className="ta-kpi">
          <p className="ta-kpi__label">{t('platform.analytics.kpi.connectionErrors')}</p>
          <p className="ta-kpi__value">{p.overviewLoading ? '…' : fmtNum(kpi?.connectionErrors)}</p>
          <div className="ta-kpi__meta">
            <span className="ta-muted">{t('platform.analytics.kpi.needsAttention')}</span>
            <Delta value={kpi?.connectionErrorsDeltaPct} />
          </div>
        </div>
      </div>

      <section className="ta-section">
        <div className="ta-section__head">
          <h2 className="ta-section__title">{t('platform.analytics.regionsTitle')}</h2>
          <div className="ta-period">
            <button type="button" className={`ta-chip${p.regionView === 'cards' ? ' is-active' : ''}`} onClick={() => p.setRegionView('cards')}>
              {t('platform.analytics.viewRegions')}
            </button>
            <button type="button" className={`ta-chip${p.regionView === 'table' ? ' is-active' : ''}`} onClick={() => p.setRegionView('table')}>
              {t('platform.analytics.viewTable')}
            </button>
          </div>
        </div>
        {p.regionView === 'cards' ? (
          <div className="ta-region-grid">
            {(overview?.regions ?? []).map((r) => (
              <button
                key={r.regionCode}
                type="button"
                className={`ta-region${p.applied.regionCode === r.regionCode ? ' is-selected' : ''}`}
                onClick={() => p.selectRegion(r.regionCode)}
              >
                <div className="ta-region__name">{p.labelGeo(r)}</div>
                <div className="ta-region__count">{fmtNum(r.enterprises)}</div>
                <div className="ta-muted"><Delta value={r.turnoverDeltaPct} /></div>
              </button>
            ))}
          </div>
        ) : (
          <div className="ta-table-wrap">
            <table className="ta-table">
              <thead>
                <tr>
                  <th>{t('platform.analytics.colRegion')}</th>
                  <th>{t('platform.analytics.colEnterprises')}</th>
                  <th>{t('platform.analytics.colDynamics')}</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.regions ?? []).map((r) => (
                  <tr key={r.regionCode} style={{ cursor: 'pointer' }} onClick={() => p.selectRegion(r.regionCode)}>
                    <td>{p.labelGeo(r)}</td>
                    <td>{fmtNum(r.enterprises)}</td>
                    <td><Delta value={r.turnoverDeltaPct} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="ta-section">
        <div className="ta-section__head">
          <h2 className="ta-section__title">{t('platform.analytics.filtersTitle')}</h2>
        </div>
        <div className="ta-filters">
          <label>
            {t('geo.region')}
            <select
              value={p.draft.regionCode}
              onChange={(e) => p.setDraft((d) => ({ ...d, regionCode: e.target.value, districtCode: '' }))}
            >
              <option value="">{t('platform.analytics.allRegions')}</option>
              {(overview?.regions ?? []).map((r) => (
                <option key={r.regionCode} value={r.regionCode}>{p.labelGeo(r)}</option>
              ))}
            </select>
          </label>
          <label>
            {t('geo.district')}
            <select
              value={p.draft.districtCode}
              disabled={!p.draft.regionCode}
              onChange={(e) => p.setDraft((d) => ({ ...d, districtCode: e.target.value }))}
            >
              <option value="">{t('platform.analytics.allDistricts')}</option>
              {p.districts.map((d) => (
                <option key={d.code} value={d.code}>{p.labelGeo(d)}</option>
              ))}
            </select>
          </label>
          <label>
            {t('platform.analytics.connectionStatus')}
            <select
              value={p.draft.connectionStatus}
              onChange={(e) => p.setDraft((d) => ({ ...d, connectionStatus: e.target.value }))}
            >
              <option value="">{t('platform.analytics.allStatuses')}</option>
              <option value="CONNECTED">{t('platform.analytics.statusConnected')}</option>
              <option value="NOT_CONNECTED">{t('platform.analytics.statusNotConnected')}</option>
            </select>
          </label>
          <label>
            {t('platform.analytics.search')}
            <input
              value={p.draft.search}
              onChange={(e) => p.setDraft((d) => ({ ...d, search: e.target.value }))}
              placeholder={t('platform.analytics.searchPh')}
            />
          </label>
        </div>
        <div className="ta-filter-actions">
          <div className="ta-period">
            <button type="button" className="ta-btn ta-btn-primary" onClick={p.applyFilters}>{t('platform.analytics.apply')}</button>
            <button type="button" className="ta-btn" onClick={p.resetFilters}>{t('platform.analytics.reset')}</button>
            <button type="button" className="ta-btn" onClick={p.saveFilters}>{t('platform.analytics.saveFilter')}</button>
            <button type="button" className="ta-btn" onClick={p.loadSavedFilters}>{t('platform.analytics.loadFilter')}</button>
          </div>
        </div>
      </section>

      <section className="ta-section">
        <div className="ta-section__head">
          <h2 className="ta-section__title">
            {t('platform.analytics.resultsTitle')}
            {p.applied.regionCode ? ` — ${(overview?.regions ?? []).find((r) => r.regionCode === p.applied.regionCode)?.nameRu ?? ''}` : ''}
          </h2>
        </div>
        {p.resultsError ? <p className="ta-error">{t('platform.analytics.loadFailed')}</p> : null}
        <div className="ta-table-wrap">
          <table className="ta-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('platform.analytics.colRegion')}</th>
                <th>{t('platform.analytics.colEnterprises')}</th>
                <th>{t('platform.analytics.colConnected')}</th>
                <th>{t('platform.analytics.colNotConnected')}</th>
                <th>{t('platform.analytics.colFiscalTurnover')}</th>
                <th>{t('platform.analytics.colNonFiscalTurnover')}</th>
                <th>{t('platform.analytics.colTotalTurnover')}</th>
                <th>{t('platform.analytics.colFiscalShare')}</th>
                <th>{t('platform.analytics.colDynamics')}</th>
              </tr>
            </thead>
            <tbody>
              {p.resultsLoading ? (
                <tr><td colSpan={10} className="ta-muted">{t('common.loading')}</td></tr>
              ) : (results?.rows?.length ? results.rows.map((row, idx) => (
                <tr key={`${row.level}-${row.code}`}>
                  <td>{p.page * (results.size || 20) + idx + 1}</td>
                  <td>{p.lang?.startsWith('uz') ? row.nameUz : row.nameRu}</td>
                  <td>{fmtNum(row.enterprises)}</td>
                  <td>{fmtNum(row.connected)} <ShareBadge value={row.connectedSharePct} tone="green" /></td>
                  <td>{fmtNum(row.notConnected)} <ShareBadge value={row.notConnectedSharePct} tone="red" /></td>
                  <td>{fmtMoney(row.fiscalTurnover)}</td>
                  <td>{fmtMoney(row.nonFiscalTurnover)}</td>
                  <td>{fmtMoney(row.totalTurnover)}</td>
                  <td>
                    <ShareBadge
                      value={row.fiscalSharePct}
                      tone={row.fiscalSharePct != null && Number(row.fiscalSharePct) >= 80 ? 'green' : 'red'}
                    />
                  </td>
                  <td><Delta value={row.turnoverDeltaPct} /></td>
                </tr>
              )) : (
                <tr><td colSpan={10} className="ta-muted">{t('platform.analytics.empty')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ta-footer">
          <span>
            {t('platform.analytics.shown', {
              from: results?.totalElements ? p.page * (results.size || 20) + 1 : 0,
              to: Math.min((p.page + 1) * (results?.size || 20), results?.totalElements || 0),
              total: results?.totalElements || 0,
            })}
          </span>
          <div className="ta-period">
            <button type="button" className="ta-btn" disabled={p.page <= 0} onClick={() => p.setPage((x) => Math.max(0, x - 1))}>
              ‹
            </button>
            <button
              type="button"
              className="ta-btn"
              disabled={!results || (p.page + 1) * (results.size || 20) >= (results.totalElements || 0)}
              onClick={() => p.setPage((x) => x + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
