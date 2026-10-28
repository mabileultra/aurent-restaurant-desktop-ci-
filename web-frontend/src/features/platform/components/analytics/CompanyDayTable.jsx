import React from 'react';
import { fmtDay, fmtMoney } from './analyticsFormat';

export default function CompanyDayTable({ t, days, loading }) {
  return (
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
          ) : (days ?? []).length ? (days ?? []).map((day) => (
            <tr key={day.date}>
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
  );
}
