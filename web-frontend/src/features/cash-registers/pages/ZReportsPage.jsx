import { Download, Filter } from 'lucide-react';
import CashRegisterErrorBanner from '../components/CashRegisterErrorBanner';
import CashRegisterHintBanner from '../components/CashRegisterHintBanner';
import ZReportsTable from '../components/z-reports/ZReportsTable';
import ZReportsOverlays from '../components/z-reports/ZReportsOverlays';
import { useZReportsPage } from '../hooks/useZReportsPage';
import PageSearchField from '../../../components/ui/PageSearchField';

export default function ZReportsPage() {
  const p = useZReportsPage();

  const errorMessage =
    p.error?.response?.data?.message ?? p.error?.message ?? p.t('zReports.loadError');

  return (
    <div className="space-y-4">
      {p.isError && <CashRegisterErrorBanner message={errorMessage} />}

      <CashRegisterHintBanner title={p.t('zReports.hintTitle')} body={p.t('zReports.hintBody')} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{p.t('zReports.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={p.handleExportAll}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download size={16} />
            {p.t('zReports.exportAll')}
          </button>
          <button
            type="button"
            onClick={() => p.setFiltersOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600"
          >
            <Filter size={16} />
            {p.t('products.toolbar.filters')}
          </button>
        </div>
      </div>

      <PageSearchField
        value={p.search}
        onChange={p.onSearchChange}
        placeholder={p.t('zReports.searchPlaceholder')}
      />

      <ZReportsTable
        t={p.t}
        rows={p.rows}
        loading={p.loading}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        selectedIds={p.selectedIds}
        selectAllRef={p.selectAllRef}
        allPageSelected={p.allPageSelected}
        toggleSelect={p.toggleSelect}
        toggleSelectAllPage={p.toggleSelectAllPage}
        onOpenRowMenu={p.openRowMenu}
      />

      <ZReportsOverlays
        t={p.t}
        filtersOpen={p.filtersOpen}
        onFiltersClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onFiltersChange={p.setFilters}
        stores={p.stores}
        onFiltersReset={p.resetFilters}
        onFiltersApply={p.applyFilters}
        rowMenu={p.rowMenu}
        onRowMenuClose={p.closeRowMenu}
        onExportRowSales={p.handleExportRowSales}
        onStartPrint={p.startPrint}
        printZId={p.printZId}
        onClosePrint={p.closeZPrint}
      />
    </div>
  );
}
