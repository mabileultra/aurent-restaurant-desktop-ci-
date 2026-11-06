import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import ReportDateBar from '../components/ReportDateBar';
import ReportStoreSelect from '../components/ReportStoreSelect';
import StockProductionCreateModal from '../../stock/components/StockProductionCreateModal';
import { useStockProductionsReportPage } from '../hooks/useStockProductionsReportPage';
import { fmtMoney } from '../../../utils/formatMoney';
import '../styles/stock-production-page.css';

export default function StockProductionPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const r = useStockProductionsReportPage();

  return (
    <div className="rst-prd-page">
      <div className="rst-prd-page__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{t('rst.stock.productionTitle')}</h1>
            <p className="rst-coming__text mb-0">{t('rst.stock.productionPageHint')}</p>
          </div>
        )}
        <BaseButton type="button" onClick={r.openCreate}>
          <Plus size={16} aria-hidden />
          {t('rst.stock.newProduction')}
        </BaseButton>
      </div>

      <div className="rst-prd-page__filters">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
      </div>

      {r.isError ? (
        <div className="rst-notice">{t('stockReports.loadFailed', { defaultValue: t('common.error') })}</div>
      ) : null}

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
        <table className="rst-wo-report__table">
          <thead>
            <tr>
              <th>{t('common.colNo')}</th>
              <th>{t('rst.stock.colProductionNo')}</th>
              <th>{t('stockReports.colDate')}</th>
              <th>{t('rst.stock.productionOutput')}</th>
              <th className="is-num">{t('rst.stock.productionOutputQty')}</th>
              <th className="is-num">{t('rst.stock.productionOutputCost')}</th>
              <th>{t('stockReports.colStore')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending ? (
              <tr><td colSpan={7} className="is-center">{t('common.loading')}</td></tr>
            ) : null}
            {!r.isPending && r.rows.length === 0 ? (
              <tr><td colSpan={7} className="is-center">{t('common.noData')}</td></tr>
            ) : null}
            {r.rows.map((row, index) => (
              <tr key={row.id}>
                <td>{r.page * r.pageSize + index + 1}</td>
                <td className="is-mono">{row.productionNumber}</td>
                <td>{row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                <td className="is-strong">{row.outputProductName || '—'}</td>
                <td className="is-num">{row.outputQuantity}</td>
                <td className="is-num">{fmtMoney(row.outputUnitCost)}</td>
                <td>{row.storeName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>

      <StockProductionCreateModal
        open={r.createOpen}
        onClose={r.closeCreate}
        onCreated={() => r.refetch()}
      />
    </div>
  );
}
