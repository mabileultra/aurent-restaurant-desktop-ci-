import React from 'react';
import { AnalyticsDelta } from './AnalyticsDelta';
import { fmtDay, fmtMoney } from './analyticsFormat';
import { CompanyAnalyticsPager } from './CompanyAnalyticsTable';
import { usePagedRows } from '../../hooks/usePagedRows';

export default function CompanyWeekTable({ t, weeks, loading }) {
  const pager = usePagedRows(weeks);
  const visible = loading ? [] : pager.rows;
  return (
    <>
      <div className="ta-table-wrap">
        <table className="ta-table">
          <thead>
            <tr>
              <th>{t('platform.analytics.colWeek')}</th>
              <th>{t('platform.analytics.colFiscalTurnover')}</th>
              <th>{t('platform.analytics.colNonFiscalTurnover')}</th>
              <th>{t('platform.analytics.colTotalTurnover')}</th>
              <th>{t('platform.analytics.colWeekDelta')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="ta-muted">{t('common.loading')}</td></tr>
            ) : visible.map((week) => (
              <tr key={week.weekFrom}>
                <td>{fmtDay(week.weekFrom)} — {fmtDay(week.weekTo)}</td>
                <td>{fmtMoney(week.fiscalTurnover)}</td>
                <td>{fmtMoney(week.nonFiscalTurnover)}</td>
                <td>{fmtMoney(week.totalTurnover)}</td>
                <td>
                  <div>{fmtMoney(week.deltaAmount)}</div>
                  <AnalyticsDelta value={week.deltaPct} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CompanyAnalyticsPager
        t={t}
        page={pager.page}
        size={pager.size}
        total={pager.total}
        pageSizes={pager.pageSizes}
        onPage={pager.setPage}
        onSize={pager.setSize}
      />
    </>
  );
}

