import { Filter } from 'lucide-react';
import { BaseButton, ErrorBanner, PageSearchField } from '../../../components/ui';
import StockProductsTable from '../components/StockProductsTable';
import StockProductsFiltersDrawer from '../components/StockProductsFiltersDrawer';
import { useStockProductsPage } from '../hooks/useStockProductsPage';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';
import { useStockFlowPaths } from '../stockFlowPaths';
import ReportFilterSelect from '../../reports/components/ReportFilterSelect';
import '../styles/stock-products-page.css';

/**
 * Остатки — только просмотр. Изменение остатка только через документы
 * (приход, списание, перемещение, инвентаризация, продажа).
 */
export default function StockProductsPage({ embeddedInRstHub = false } = {}) {
  const workspace = useRestaurantWorkspaceStore();
  const paths = useStockFlowPaths();
  const p = useStockProductsPage({
    preferredStoreId: workspace.storeId,
  });

  return (
    <div className={`rst-stock-products${embeddedInRstHub ? ' is-embedded' : ''}`}>
      <div className="rst-stock-products__toolbar">
        {!embeddedInRstHub ? (
          <div>
            <h1 className="rst-coming__title">{p.t('stockModule.title')}</h1>
            <p className="rst-coming__text mb-0">{p.t('rst.admin.stockBalancesHint')}</p>
          </div>
        ) : (
          <p className="rst-coming__text mb-0">{p.t('rst.stock.balancesReadOnlyHint')}</p>
        )}
        <div className="rst-stock-products__actions">
          <BaseButton type="button" variant="secondary" onClick={() => p.setFiltersOpen(true)}>
            <Filter size={16} aria-hidden />
            {p.t('products.toolbar.filters')}
          </BaseButton>
        </div>
      </div>

      <div className="rst-stock-products__filters">
        <PageSearchField
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('stockModule.searchPh')}
        />
        {p.needsStorePick ? (
          <ReportFilterSelect
            label={p.t('stockReports.colStore')}
            value={p.storeId}
            onChange={p.handleStoreChange}
            emptyLabel={p.t('stockModal.pickStore')}
            options={p.stores.map((s) => ({ value: String(s.id), label: s.name }))}
          />
        ) : null}
      </div>

      {p.needsStorePick && p.effectiveStoreId == null ? (
        <div className="rst-notice">{p.t('stockModal.storeRequired')}</div>
      ) : null}

      {p.isError ? <ErrorBanner message={p.errorMessage} /> : null}

      <StockProductsTable
        t={p.t}
        rows={p.rows}
        loading={p.loading}
        showEmptyHint={p.showEmptyHint}
        displayBarcode={p.displayBarcode}
        onOpenRowMenu={null}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        manage={false}
      />

      <StockProductsFiltersDrawer
        open={p.filtersOpen}
        onClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onChange={p.setFilters}
        onReset={p.resetFilters}
        onApply={p.applyFilters}
        links={[
          { to: paths.products, label: p.t('rst.nav.stockProducts') },
          { to: paths.receipts, label: p.t('rst.admin.stockReceipt') },
          { to: paths.writeOffs, label: p.t('rst.nav.stockWriteOffs') },
        ]}
      />
    </div>
  );
}
