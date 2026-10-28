import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsDelta } from './AnalyticsDelta';
import { fmtMoney } from './analyticsFormat';

export default function CompanyAnalyticsTable({ t, rows, loading, page, size, labelGeo }) {
  const navigate = useNavigate();
  const open = (companyId) => navigate(`/platform/analytics/companies/${companyId}`);

  return (
    <div className="ta-table-wrap">
      <table className="ta-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{t('platform.analytics.colCompany')}</th>
            <th>{t('platform.analytics.colRegion')}</th>
            <th>{t('platform.analytics.connectionStatus')}</th>
            <th>{t('platform.analytics.colFiscalTurnover')}</th>
            <th>{t('platform.analytics.colNonFiscalTurnover')}</th>
            <th>{t('platform.analytics.colTotalTurnover')}</th>
            <th>{t('platform.analytics.colThisWeek')}</th>
            <th>{t('platform.analytics.colPrevWeek')}</th>
            <th>{t('platform.analytics.colWeekDelta')}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={10} className="ta-muted">{t('common.loading')}</td></tr>
          ) : rows.length ? rows.map((row, index) => (
            <tr
              key={row.companyId}
              className="ca-row"
              tabIndex={0}
              onClick={() => open(row.companyId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') open(row.companyId);
              }}
            >
              <td>{page * size + index + 1}</td>
              <td>
                <div className="ca-firm">{row.name}</div>
                <div className="ta-muted">{row.tin || '—'}</div>
              </td>
              <td>{labelGeo({ nameRu: row.regionNameRu, nameUz: row.regionNameUz }) || '—'}</td>
              <td>
                <span className={`ta-badge ${row.connected ? 'ta-badge-green' : 'ta-badge-red'}`}>
                  {row.connected ? t('platform.analytics.statusConnected') : t('platform.analytics.statusNotConnected')}
                </span>
              </td>
              <td>{fmtMoney(row.fiscalTurnover)}</td>
              <td>{fmtMoney(row.nonFiscalTurnover)}</td>
              <td>{fmtMoney(row.totalTurnover)}</td>
              <td>{fmtMoney(row.weekTurnover)}</td>
              <td>{fmtMoney(row.prevWeekTurnover)}</td>
              <td>
                <div>{fmtMoney(row.weekDeltaAmount)}</div>
                <AnalyticsDelta value={row.weekDeltaPct} />
              </td>
            </tr>
          )) : (
            <tr><td colSpan={10} className="ta-muted">{t('platform.analytics.empty')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function CompanyAnalyticsPager({ t, page, size, total, onPage }) {
  const from = total ? page * size + 1 : 0;
  const to = Math.min((page + 1) * size, total);
  return (
    <div className="ta-footer">
      <span>{t('platform.analytics.shown', { from, to, total })}</span>
      <div className="ta-period">
        <button type="button" className="ta-btn" disabled={page <= 0} onClick={() => onPage(page - 1)}>‹</button>
        <button type="button" className="ta-btn" disabled={(page + 1) * size >= total} onClick={() => onPage(page + 1)}>›</button>
      </div>
    </div>
  );
}
