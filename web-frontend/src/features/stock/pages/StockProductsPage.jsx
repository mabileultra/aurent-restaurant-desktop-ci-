import { Filter, Plus } from 'lucide-react';
import {
  BaseButton,
  ErrorBanner,
  PageLayout,
  PageSearchField,
} from '../../../components/ui';
import StockProductsTable from '../components/StockProductsTable';
import StockProductsModals from '../components/StockProductsModals';
import { useStockProductsPage } from '../hooks/useStockProductsPage';

/** Grocery / retail stock products (restaurant stock lives on r-aurent). */
export default function StockProductsPage() {
  const p = useStockProductsPage({ preferredStoreId: null });

  const actions = (
    <>
      {p.manage ? (
        <BaseButton onClick={p.handleAddProduct} className="admin-btn-primary">
          <Plus size={16} />
          {p.t('products.add')}
        </BaseButton>
      ) : null}
      {p.manage ? (
        <BaseButton variant="secondary" onClick={() => p.setReceiveOpen(true)} className="admin-btn-secondary">
          <Plus size={16} />
          {p.t('stockModule.add')}
        </BaseButton>
      ) : null}
      <BaseButton variant="secondary" onClick={() => p.setFiltersOpen(true)} className="admin-btn-secondary">
        <Filter size={16} />
        {p.t('products.toolbar.filters')}
      </BaseButton>
    </>
  );

  return (
    <PageLayout
      title={p.t('stockModule.title')}
      actions={actions}
      filters={(
        <PageSearchField
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('stockModule.searchPh')}
        />
      )}
    >
      {p.isError && <ErrorBanner message={p.errorMessage} />}

      <div className="admin-table-shell">
        <StockProductsTable
          t={p.t}
          rows={p.rows}
          loading={p.loading}
          showEmptyHint={p.showEmptyHint}
          displayBarcode={p.displayBarcode}
          onOpenRowMenu={p.openRowMenu}
          page={p.page}
          pageSize={p.pageSize}
          total={p.total}
          totalPages={p.totalPages}
          onPageChange={p.setPage}
          onPageSizeChange={p.setPageSize}
        />
      </div>

      <StockProductsModals
        t={p.t}
        manage={p.manage}
        filtersOpen={p.filtersOpen}
        onFiltersClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onFiltersChange={p.setFilters}
        onFiltersReset={p.resetFilters}
        onFiltersApply={p.applyFilters}
        receiveOpen={p.receiveOpen}
        onReceiveClose={() => p.setReceiveOpen(false)}
        onInvalidateCaches={p.invalidateCaches}
        showCreate={p.showCreate}
        createStore={p.createStore}
        catalogModalKey={p.catalogModalKey}
        onCreateStoreChange={p.handleCreateStoreChange}
        onCatalogClose={p.closeCatalogModal}
        editProduct={p.editProduct}
        categories={p.categories}
        stores={p.stores}
        stockProduct={p.stockProduct}
        onStockClose={() => p.setStockProduct(null)}
        receiveProduct={p.receiveProduct}
        onReceiveProductClose={() => p.setReceiveProduct(null)}
        infoProductId={p.infoProductId}
        onInfoClose={() => p.setInfoProductId(null)}
        onInfoEdit={(prod) => {
          if (!prod) return;
          p.setInfoProductId(null);
          p.setEditProduct(prod);
        }}
        onInfoReceive={(prod) => {
          if (!prod) return;
          p.setInfoProductId(null);
          p.setReceiveProduct({ id: prod.id, name: prod.name });
        }}
        onInfoDelete={(prod) => {
          if (!prod) return;
          p.setInfoProductId(null);
          p.setDeleteProduct(prod);
        }}
        deleteProduct={p.deleteProduct}
        onDeleteClose={() => p.setDeleteProduct(null)}
        onDeleteConfirm={p.confirmDelete}
        rowMenu={p.rowMenu}
        onRowMenuClose={p.closeRowMenu}
        onInfo={p.setInfoProductId}
        onEdit={p.setEditProduct}
        onAdjust={p.setStockProduct}
        onReceive={p.setReceiveProduct}
        onDelete={p.setDeleteProduct}
      />
    </PageLayout>
  );
}
