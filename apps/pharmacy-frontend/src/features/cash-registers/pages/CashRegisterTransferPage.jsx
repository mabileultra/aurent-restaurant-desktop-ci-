import { Download } from 'lucide-react';
import CashRegisterErrorBanner from '../components/CashRegisterErrorBanner';
import CashRegisterHintBanner from '../components/CashRegisterHintBanner';
import CashRegisterSearchField from '../components/CashRegisterSearchField';
import CashTransferTable from '../components/CashTransferTable';
import CashTransferFiltersDrawer from '../components/CashTransferFiltersDrawer';
import { useCashRegisterTransferPage } from '../hooks/useCashRegisterTransferPage';

export default function CashRegisterTransferPage() {
  const p = useCashRegisterTransferPage();

  const errorMessage =
    p.error?.response?.data?.message ?? p.error?.message ?? p.t('cashRegisters.transferLoadError');

  return (
    <div className="space-y-4">
      {p.isError && <CashRegisterErrorBanner message={errorMessage} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-ink">{p.t('cashRegisters.transferTitle')}</h1>
        <button
          type="button"
          onClick={p.handleExportExcel}
          disabled={p.exporting}
          className="ui-btn ui-btn-secondary shrink-0"
        >
          <Download size={16} strokeWidth={1.75} />
          {p.exporting ? p.t('cashRegisters.transferExporting') : p.t('cashRegisters.transferExport')}
        </button>
      </div>

      <CashRegisterHintBanner
        title={p.t('cashRegisters.transferHintTitle')}
        body={p.t('cashRegisters.transferHintBody')}
      />

      <CashRegisterSearchField
        value={p.search}
        onChange={(e) => p.onSearchChange(e.target.value)}
        placeholder={p.t('cashRegisters.transferSearchPlaceholder')}
        filterLabel={p.t('products.toolbar.filters')}
        onOpenFilters={() => p.setFiltersOpen(true)}
      />

      <CashTransferTable
        t={p.t}
        rows={p.rows}
        loading={p.loading}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
      />

      <CashTransferFiltersDrawer
        open={p.filtersOpen}
        onClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onChange={p.setFilters}
        onApply={p.applyFilters}
        onReset={p.resetFilters}
      />
    </div>
  );
}
