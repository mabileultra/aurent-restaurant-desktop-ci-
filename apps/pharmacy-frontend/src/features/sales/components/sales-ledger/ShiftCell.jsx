export default function ShiftCell({ row, t, fmtAt }) {
  if (!row.shiftId) {
    return <span className="text-ink-disabled">{t('salesLedger.shiftNoData')}</span>;
  }
  const opened = row.shiftOpenedAt ? fmtAt(row.shiftOpenedAt) : '—';
  const closed = row.shiftClosedAt
    ? fmtAt(row.shiftClosedAt)
    : row.shiftStatus === 'OPEN'
      ? t('salesLedger.shiftStillOpen')
      : '—';
  return (
    <div className="ui-tabular min-w-[10.5rem] text-ink">
      <div className="whitespace-nowrap text-xs">
        <span className="text-ink-muted">{t('salesLedger.shiftOpened')}: </span>
        {opened}
      </div>
      <div className="whitespace-nowrap text-xs">
        <span className="text-ink-muted">{t('salesLedger.shiftClosed')}: </span>
        {closed}
      </div>
      {row.shiftZReportId ? (
        <div className="mt-0.5 text-[11px] font-semibold text-primary-700">
          {t('salesLedger.shiftZReport', { id: row.shiftZReportId })}
        </div>
      ) : null}
    </div>
  );
}
