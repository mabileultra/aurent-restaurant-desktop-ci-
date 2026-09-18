import TablePagination from '../../../components/shared/TablePagination';
import { ErrorBanner } from '../../../components/ui';
import PharmacyListToolbar from '../components/PharmacyListToolbar';
import PharmacyMarkStatusBadge from '../components/PharmacyMarkStatusBadge';
import PharmacyStockLayout from '../components/PharmacyStockLayout';
import { usePharmacyAslWithdrawMonitorPage } from '../hooks/usePharmacyAslWithdrawMonitorPage';
import { stockMarkAttentionKind } from '../utils/stockMarkNeedsAttention';
import '../styles/pharmacy-asl-withdraw-monitor.css';

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function shortMark(code) {
  const s = String(code || '');
  if (s.length <= 28) return s;
  return `${s.slice(0, 14)}…${s.slice(-10)}`;
}

function attentionLabel(row, t) {
  const kind = stockMarkAttentionKind(row);
  if (kind === 'pending') return t('pharmacyStock.aslMonitor.attentionPending');
  if (kind === 'error') return t('pharmacyStock.aslMonitor.attentionError');
  return t('pharmacyStock.aslMonitor.attentionOk');
}

export default function PharmacyAslWithdrawMonitorPage() {
  const p = usePharmacyAslWithdrawMonitorPage();
  const { t } = p;

  return (
    <PharmacyStockLayout
      title={t('pharmacyStock.aslMonitor.title')}
      subtitle={t('pharmacyStock.aslMonitor.subtitle')}
    >
      <PharmacyListToolbar
        t={t}
        onRefresh={p.refresh}
        search={p.search}
        onSearchChange={p.setSearch}
        searchPlaceholder={t('pharmacyStock.aslMonitor.searchPh')}
        filterOptions={p.statusFilters}
        filterValue={p.status}
        onFilterChange={p.setStatus}
      />

      <div className="pharmacy-asl-monitor__controls">
        <label className="pharmacy-asl-monitor__field">
          <span>{t('pharmacyStock.aslMonitor.store')}</span>
          <select
            value={p.storeId}
            onChange={(e) => p.setStoreId(e.target.value)}
          >
            {p.storeOptions.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label className="pharmacy-asl-monitor__check">
          <input
            type="checkbox"
            checked={p.problemsOnly}
            onChange={(e) => p.setProblemsOnly(e.target.checked)}
          />
          {t('pharmacyStock.aslMonitor.problemsOnly')}
        </label>

        <label className="pharmacy-asl-monitor__check">
          <input
            type="checkbox"
            checked={p.soldTodayOnly}
            onChange={(e) => p.setSoldTodayOnly(e.target.checked)}
          />
          {t('pharmacyStock.aslMonitor.soldToday')}
        </label>

        <label className="pharmacy-asl-monitor__check">
          <input
            type="checkbox"
            checked={p.currentShiftOnly}
            onChange={(e) => p.setCurrentShiftOnly(e.target.checked)}
            disabled={!p.storeId}
          />
          {t('pharmacyStock.aslMonitor.currentShift')}
        </label>
      </div>

      {p.shiftMissing ? (
        <p className="pharmacy-asl-monitor__hint">{t('pharmacyStock.aslMonitor.noOpenShift')}</p>
      ) : null}

      {p.attentionCount > 0 ? (
        <p className="pharmacy-asl-monitor__alert">
          {t('pharmacyStock.aslMonitor.attentionBanner', { count: p.attentionCount })}
        </p>
      ) : (
        <p className="pharmacy-asl-monitor__hint">{t('pharmacyStock.aslMonitor.emptyOkHint')}</p>
      )}

      {p.isError ? <ErrorBanner message={p.errorMessage} /> : null}

      <div className="admin-table-shell pharmacy-asl-monitor__table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>{t('pharmacyStock.aslMonitor.colProduct')}</th>
                <th>{t('pharmacyStock.aslMonitor.colMark')}</th>
                <th>{t('pharmacyStock.aslMonitor.colReceipt')}</th>
                <th>{t('pharmacyStock.aslMonitor.colSoldAt')}</th>
                <th>{t('pharmacyStock.aslMonitor.colLocal')}</th>
                <th>{t('pharmacyStock.aslMonitor.colAsl')}</th>
                <th>{t('pharmacyStock.aslMonitor.colAttention')}</th>
                <th>{t('pharmacyStock.aslMonitor.colAttempts')}</th>
              </tr>
            </thead>
            <tbody>
              {p.loading && !p.rows.length ? (
                <tr><td colSpan={8}>{t('common.loading')}</td></tr>
              ) : null}
              {!p.loading && !p.rows.length ? (
                <tr><td colSpan={8}>{t('pharmacyStock.aslMonitor.empty')}</td></tr>
              ) : null}
              {p.rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.needsAttention ? 'pharmacy-asl-monitor__row--warn' : undefined}
                >
                  <td>
                    <div className="pharmacy-asl-monitor__product">{row.productName || '—'}</div>
                    <div className="pharmacy-asl-monitor__muted">store #{row.storeId}</div>
                  </td>
                  <td>
                    <code className="pharmacy-asl-monitor__code" title={row.markCode}>
                      {shortMark(row.markCode)}
                    </code>
                  </td>
                  <td>{row.receiptNumber || '—'}</td>
                  <td>{formatWhen(row.soldAt)}</td>
                  <td><PharmacyMarkStatusBadge status={row.status} t={t} /></td>
                  <td>
                    <span className="pharmacy-asl-monitor__asl">
                      {row.aslStatus || '—'}
                    </span>
                    {row.lastWithdrawError ? (
                      <div className="pharmacy-asl-monitor__err" title={row.lastWithdrawError}>
                        {row.lastWithdrawError}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className={row.needsAttention
                      ? 'pharmacy-asl-monitor__badge pharmacy-asl-monitor__badge--warn'
                      : 'pharmacy-asl-monitor__badge pharmacy-asl-monitor__badge--ok'}
                    >
                      {attentionLabel(row, t)}
                    </span>
                  </td>
                  <td>
                    {row.withdrawAttempts || 0}
                    {row.lastWithdrawAt ? (
                      <div className="pharmacy-asl-monitor__muted">{formatWhen(row.lastWithdrawAt)}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={p.page}
          pageSize={p.pageSize}
          total={p.total}
          totalPages={p.totalPages}
          onPageChange={p.setPage}
          onPageSizeChange={p.setPageSize}
          pageSizeOptions={p.pageSizeOptions}
        />
      </div>
    </PharmacyStockLayout>
  );
}
