import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { BaseSelect } from '../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import ReportTableCard from '../components/ReportTableCard';
import { fmtMoney } from '../../../utils/formatMoney';
import { usePriceRegistryJournalPage } from '../hooks/usePriceRegistryJournalPage';
import './price-registry-journal.css';

export default function PriceRegistryJournalPage() {
  const { t } = useTranslation();
  const r = usePriceRegistryJournalPage(t);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('priceRegistry.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('priceRegistry.subtitle')}
          </p>
          {r.latest ? (
            <p className="mt-1 text-xs text-slate-500">
              {t('priceRegistry.latestSnap', {
                date: r.latest.registryDate || '—',
                rows: r.latest.rowCount ?? 0,
              })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="admin-btn-secondary px-4 py-2 text-sm"
            disabled={r.syncing}
            onClick={() => r.sync()}
          >
            {r.syncing ? t('common.loading') : t('priceRegistry.sync')}
          </button>
          <button
            type="button"
            className="admin-btn-primary px-4 py-2 text-sm"
            disabled={r.applying || r.status !== 'PENDING'}
            onClick={() => r.apply()}
          >
            {r.applying ? t('common.loading') : t('priceRegistry.applyPending')}
          </button>
        </div>
      </div>

      <div className="max-w-xs">
        <BaseSelect
          value={r.status}
          onChange={(e) => r.handleStatusChange(e.target.value)}
          options={[
            { value: '', label: t('priceRegistry.filterAll') },
            { value: 'PENDING', label: t('priceRegistry.statusPending') },
            { value: 'APPLIED', label: t('priceRegistry.statusApplied') },
            { value: 'SKIPPED_OK', label: t('priceRegistry.statusSkipped') },
            { value: 'UNMATCHED', label: t('priceRegistry.statusUnmatched') },
          ]}
        />
      </div>

      <ReportTableCard
        pagination={{
          page: r.page,
          pageSize: r.pageSize,
          total: r.total,
          totalPages: r.totalPages,
          onPageChange: r.setPage,
          onPageSizeChange: r.setPageSize,
        }}
      >
        <table className="w-full text-sm price-registry-journal__table">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3">{t('priceRegistry.colProduct')}</th>
              <th className="px-4 py-3">{t('priceRegistry.colBarcode')}</th>
              <th className="px-4 py-3 text-right">{t('priceRegistry.colOld')}</th>
              <th className="px-4 py-3 text-right">{t('priceRegistry.colLimit')}</th>
              <th className="px-4 py-3 text-right">{t('priceRegistry.colNew')}</th>
              <th className="px-4 py-3">{t('priceRegistry.colStatus')}</th>
              <th className="px-4 py-3">{t('priceRegistry.colWhen')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && (
              <tr><td colSpan={9} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>
            )}
            {!r.isPending && r.rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>
            )}
            {r.rows.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b border-slate-100 dark:border-slate-800${
                  row.status === 'PENDING' ? ' price-registry-journal__row--pending' : ''
                }`}
              >
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.id} />
                <td className="px-4 py-3 font-medium">{row.productName || '—'}</td>
                <td className="px-4 py-3">{row.barcode || row.pharmId || '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.oldSellingPrice != null ? fmtMoney(row.oldSellingPrice) : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {fmtMoney(row.limitPrice)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.newSellingPrice != null ? fmtMoney(row.newSellingPrice) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`price-registry-journal__badge is-${String(row.status || '').toLowerCase()}`}>
                    {t(`priceRegistry.status${statusKey(row.status)}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {row.appliedAt
                    ? fmtDate(new Date(row.appliedAt), 'dd.MM.yyyy HH:mm')
                    : row.createdAt
                      ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm')
                      : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}

function statusKey(status) {
  switch (status) {
    case 'PENDING': return 'Pending';
    case 'APPLIED': return 'Applied';
    case 'SKIPPED_OK': return 'Skipped';
    case 'UNMATCHED': return 'Unmatched';
    default: return 'Pending';
  }
}
