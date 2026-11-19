import { FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { BaseSelect, EmptyState, PageHeader } from '../../../components/ui';
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
      <div>
        <PageHeader
          title={t('priceRegistry.title')}
          subtitle={t('priceRegistry.subtitle')}
          actions={(
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                disabled={r.syncing}
                onClick={() => r.sync()}
              >
                {r.syncing ? t('common.loading') : t('priceRegistry.sync')}
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-primary"
                disabled={r.applying || r.status !== 'PENDING'}
                onClick={() => r.apply()}
              >
                {r.applying ? t('common.loading') : t('priceRegistry.applyPending')}
              </button>
            </div>
          )}
        />
        {r.latest ? (
          <p className="ui-tabular mt-1.5 text-xs text-ink-muted">
            {t('priceRegistry.latestSnap', {
              date: r.latest.registryDate || '—',
              rows: r.latest.rowCount ?? 0,
            })}
          </p>
        ) : null}
      </div>

      <div className="max-w-xs">
        <BaseSelect
          value={r.status}
          onChange={(e) => r.handleStatusChange(e.target.value)}
          options={[
            { value: '', label: t('priceRegistry.filterAll') },
            { value: 'PENDING', label: t('priceRegistry.statusPending') },
            { value: 'APPLIED', label: t('priceRegistry.statusApplied') },
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
        <table className="ui-table price-registry-journal__table">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('priceRegistry.colProduct')}</th>
              <th className="ui-th">{t('priceRegistry.colBarcode')}</th>
              <th className="ui-th text-right">{t('priceRegistry.colOld')}</th>
              <th className="ui-th text-right">{t('priceRegistry.colLimit')}</th>
              <th className="ui-th text-right">{t('priceRegistry.colNew')}</th>
              <th className="ui-th">{t('priceRegistry.colStatus')}</th>
              <th className="ui-th">{t('priceRegistry.colWhen')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && (
              <tr><td colSpan={9} className="ui-td py-8 text-center text-ink-muted">{t('common.loading')}</td></tr>
            )}
            {!r.isPending && r.rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-0">
                  <EmptyState icon={FileSpreadsheet} title={t('common.noData')} />
                </td>
              </tr>
            )}
            {r.rows.map((row, index) => (
              <tr
                key={row.id}
                className={`ui-tr${
                  row.status === 'PENDING' ? ' price-registry-journal__row--pending' : ''
                }`}
              >
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.id} />
                <td className="ui-td font-medium">{row.productName || '—'}</td>
                <td className="ui-td-nowrap text-ink-muted">{row.barcode || row.pharmId || '—'}</td>
                <td className="ui-td-nowrap text-right">
                  {row.oldSellingPrice != null ? fmtMoney(row.oldSellingPrice) : '—'}
                </td>
                <td className="ui-td-nowrap text-right font-semibold">
                  {fmtMoney(row.limitPrice)}
                </td>
                <td className="ui-td-nowrap text-right">
                  {row.newSellingPrice != null ? fmtMoney(row.newSellingPrice) : '—'}
                </td>
                <td className="ui-td-nowrap">
                  <span className={`price-registry-journal__badge is-${String(row.status || '').toLowerCase()}`}>
                    {t(`priceRegistry.status${statusKey(row.status)}`)}
                  </span>
                </td>
                <td className="ui-td-nowrap text-xs text-ink-muted">
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
