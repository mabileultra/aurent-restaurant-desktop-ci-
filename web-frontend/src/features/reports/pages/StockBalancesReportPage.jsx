import { useTranslation } from 'react-i18next';
import { stockReportApi } from '../../../api';
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.balancesTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.balancesSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => stockReportApi.exportBalances(r.exportParams)}
          filenamePrefix="stock_balances"
        />
      </div>

      <StockBalancesFilters
        t={t}
        search={r.search}
        onSearchChange={r.handleSearchChange}
        storeId={r.storeId}
        stores={r.stores}
        onStoreChange={r.handleStoreChange}
        categoryId={r.categoryId}
        categories={r.categories}
        onCategoryChange={r.handleCategoryChange}
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
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3">{t('stockReports.colCategory')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStock')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colMin')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStockValue')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={7} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row, index) => (
              <tr key={row.productId} className="border-b border-slate-100 dark:border-slate-800">
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.productId} />
                <ReportProductNameCell name={row.productName} sku={row.sku} barcode={row.barcode} />
                <td className="px-4 py-3">{row.categoryName || '—'}</td>
                <td className="px-4 py-3 text-right">{row.stockQuantity}</td>
                <td className="px-4 py-3 text-right">{row.lowStockAlert}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(row.stockValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
