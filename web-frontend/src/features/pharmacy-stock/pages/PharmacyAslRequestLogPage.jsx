import TablePagination from '../../../components/shared/TablePagination';
import { ErrorBanner } from '../../../components/ui';
import PharmacyListToolbar from '../components/PharmacyListToolbar';
import PharmacyStockLayout from '../components/PharmacyStockLayout';
import { usePharmacyAslRequestLogPage } from '../hooks/usePharmacyAslRequestLogPage';
import '../styles/pharmacy-asl-request-log.css';

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function outcomeClass(outcome) {
  if (outcome === 'SENT_OK') return 'pharmacy-asl-reqlog__badge--ok';
  if (outcome === 'SENT_WAITING') return 'pharmacy-asl-reqlog__badge--wait';
  if (outcome === 'SENT_FAIL') return 'pharmacy-asl-reqlog__badge--fail';
  return 'pharmacy-asl-reqlog__badge--skip';
}

function outcomeLabel(outcome, t) {
  if (outcome === 'SENT_OK') return t('pharmacyStock.aslRequestLog.outcomeSentOk');
  if (outcome === 'SENT_WAITING') return t('pharmacyStock.aslRequestLog.outcomeSentWaiting');
  if (outcome === 'SENT_FAIL') return t('pharmacyStock.aslRequestLog.outcomeSentFail');
  if (outcome === 'NOT_SENT') return t('pharmacyStock.aslRequestLog.outcomeNotSent');
  return outcome || '—';
}

function operationLabel(operation, t) {
  if (operation === 'VERIFY') return t('pharmacyStock.aslRequestLog.opVerify');
  if (operation === 'WITHDRAW') return t('pharmacyStock.aslRequestLog.opWithdraw');
  return operation || '—';
}

export default function PharmacyAslRequestLogPage() {
  const p = usePharmacyAslRequestLogPage();
  const { t } = p;

  return (
    <PharmacyStockLayout
      title={t('pharmacyStock.aslRequestLog.title')}
      subtitle={t('pharmacyStock.aslRequestLog.subtitle')}
    >
      <PharmacyListToolbar
        t={t}
        onRefresh={p.refresh}
        search={p.search}
        onSearchChange={p.setSearch}
        searchPlaceholder={t('pharmacyStock.aslRequestLog.searchPh')}
        filterOptions={p.outcomeFilters}
        filterValue={p.outcome}
        onFilterChange={p.setOutcome}
      />

      <div className="pharmacy-asl-reqlog__controls">
        <label className="pharmacy-asl-reqlog__field">
          <span>{t('pharmacyStock.aslRequestLog.store')}</span>
          <select value={p.storeId} onChange={(e) => p.setStoreId(e.target.value)}>
            {p.storeOptions.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label className="pharmacy-asl-reqlog__field">
          <span>{t('pharmacyStock.aslRequestLog.operation')}</span>
          <select value={p.operation} onChange={(e) => p.setOperation(e.target.value)}>
            {p.operationFilters.map((opt) => (
              <option key={opt.value || 'all-op'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label className="pharmacy-asl-reqlog__field">
          <span>{t('pharmacyStock.aslRequestLog.reached')}</span>
          <select value={p.reached} onChange={(e) => p.setReached(e.target.value)}>
            {p.reachedFilters.map((opt) => (
              <option key={opt.value || 'all-reached'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="pharmacy-asl-reqlog__hint">{t('pharmacyStock.aslRequestLog.retentionHint')}</p>

      {p.isError ? <ErrorBanner message={p.errorMessage} /> : null}

      <div className="pharmacy-stock__table-wrap">
        <table className="pharmacy-stock__table">
          <thead>
            <tr>
              <th>{t('pharmacyStock.aslRequestLog.colWhen')}</th>
              <th>{t('pharmacyStock.aslRequestLog.colStore')}</th>
              <th>{t('pharmacyStock.aslRequestLog.colOperation')}</th>
              <th>{t('pharmacyStock.aslRequestLog.colReached')}</th>
              <th>{t('pharmacyStock.aslRequestLog.colOutcome')}</th>
              <th>{t('pharmacyStock.aslRequestLog.colMark')}</th>
              <th>{t('pharmacyStock.aslRequestLog.colHttp')}</th>
              <th>{t('pharmacyStock.aslRequestLog.colAsl')}</th>
              <th>{t('pharmacyStock.aslRequestLog.colDuration')}</th>
              <th>{t('pharmacyStock.aslRequestLog.colMessage')}</th>
            </tr>
          </thead>
          <tbody>
            {p.loading && p.rows.length === 0 ? (
              <tr>
                <td colSpan={10}>{t('common.loading')}</td>
              </tr>
            ) : null}
            {!p.loading && p.rows.length === 0 ? (
              <tr>
                <td colSpan={10}>{t('pharmacyStock.aslRequestLog.empty')}</td>
              </tr>
            ) : null}
            {p.rows.map((row) => (
              <tr key={row.id}>
                <td>{formatWhen(row.createdAt)}</td>
                <td>{row.storeName || row.storeId || '—'}</td>
                <td>{operationLabel(row.operation, t)}</td>
                <td>
                  <span className={row.reached
                    ? 'pharmacy-asl-reqlog__reached--yes'
                    : 'pharmacy-asl-reqlog__reached--no'}
                  >
                    {row.reached
                      ? t('pharmacyStock.aslRequestLog.reachedYes')
                      : t('pharmacyStock.aslRequestLog.reachedNo')}
                  </span>
                </td>
                <td>
                  <span className={`pharmacy-asl-reqlog__badge ${outcomeClass(row.outcome)}`}>
                    {outcomeLabel(row.outcome, t)}
                  </span>
                </td>
                <td className="pharmacy-asl-reqlog__mono">{row.markCodeShort || '—'}</td>
                <td>{row.httpStatus ?? '—'}</td>
                <td>{row.aslStatus || '—'}</td>
                <td>{row.durationMs != null ? `${row.durationMs} ms` : '—'}</td>
                <td className="pharmacy-asl-reqlog__msg">{row.message || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={p.page}
        totalPages={p.totalPages}
        total={p.total}
        pageSize={p.pageSize}
        pageSizeOptions={p.pageSizeOptions}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
      />
    </PharmacyStockLayout>
  );
}
