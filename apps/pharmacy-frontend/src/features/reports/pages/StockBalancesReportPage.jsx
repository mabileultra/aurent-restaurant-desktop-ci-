import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState, PageHeader } from '../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import ReportProductNameCell from '../components/ReportProductNameCell';
import ReportTableCard from '../components/ReportTableCard';
import StockBalancesFilters from '../components/stock-balances/StockBalancesFilters';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportExportButton from '../components/ReportExportButton';
import { useStockBalancesReportPage } from '../hooks/useStockBalancesReportPage';

export default function StockBalancesReportPage() {
  const { t } = useTranslation();
  const r = useStockBalancesReportPage();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('stockReports.balancesTitle')}
        subtitle={t('stockReports.balancesSubtitle')}
        actions={(
          <ReportExportButton
            fetchBlob={r.fetchExportBlob}
            filenamePrefix="pharmacy_stock_balances"
          />
        )}
      />

      <StockBalancesFilters
        t={t}
        search={r.search}
        onSearchChange={r.handleSearchChange}
        storeId={r.storeId}
        stores={r.stores}
        onStoreChange={r.handleStoreChange}
        onlyWithStock={r.onlyWithStock}
        onOnlyWithStockChange={r.handleOnlyWithStockChange}
      />

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
        <table className="ui-table">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('stockReports.colProduct')}</th>
              <th className="ui-th">{t('pharmacyStock.colManufacturer')}</th>
              <th className="ui-th text-right">{t('stockReports.colStock')}</th>
              <th className="ui-th text-right">{t('stockReports.colMin')}</th>
              <th className="ui-th text-right">{t('stockReports.colStockValue')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={7} className="ui-td py-8 text-center text-ink-muted">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState icon={Package} title={t('common.noData')} />
                </td>
              </tr>
            )}
            {r.rows.map((row, index) => (
              <tr key={row.productId} className="ui-tr">
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.productId} />
                <ReportProductNameCell name={row.productName} sku={row.sku} barcode={row.barcode} />
                <td className="ui-td text-ink-muted">{row.manufacturer || '—'}</td>
                <td className="ui-td-nowrap text-right">{row.stockQuantity}</td>
                <td className="ui-td-nowrap text-right text-ink-muted">{row.lowStockAlert}</td>
                <td className="ui-td-nowrap text-right font-semibold">{fmtMoney(row.stockValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
