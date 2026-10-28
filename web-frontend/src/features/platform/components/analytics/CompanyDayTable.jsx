import React from 'react';
import { fmtDay, fmtMoney } from './analyticsFormat';
import { CompanyAnalyticsPager } from './CompanyAnalyticsTable';
import { usePagedRows } from '../../hooks/usePagedRows';

export default function CompanyDayTable({ t, days, loading, onOpenDay }) {
  const pager = usePagedRows(days);
  const visible = loading ? [] : pager.rows;
  return (
    <>
      <div className="ta-table-wrap">
        <table className="ta-table">
          <thead>
            <tr>
              <th>{t('platform.analytics.colDay')}</th>
              <th>{t('platform.analytics.colFiscalTurnover')}</th>
              <th>{t('platform.analytics.colNonFiscalTurnover')}</th>
              <th>{t('platform.analytics.colTotalTurnover')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="ta-muted">{t('common.loading')}</td></tr>
            ) : visible.length ? visible.map((day) => (
              <tr
                key={day.date}
                className="ca-day-row"
                onClick={() => onOpenDay?.(day.date)}
              >
                <td>{fmtDay(day.date)}</td>
                <td>{fmtMoney(day.fiscalTurnover)}</td>
                <td>{fmtMoney(day.nonFiscalTurnover)}</td>
                <td>{fmtMoney(day.totalTurnover)}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="ta-muted">{t('platform.analytics.empty')}</td></tr>
            )}
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
