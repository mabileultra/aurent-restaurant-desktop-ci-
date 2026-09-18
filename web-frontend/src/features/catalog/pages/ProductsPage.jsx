import ProductsToolbar from '../components/products/ProductsToolbar';
import ProductsTable from '../components/products/ProductsTable';
import ProductsModals from '../components/products/ProductsModals';
import ProductsSearchField from '../components/products/ProductsSearchField';
import { useProductsPage } from '../hooks/useProductsPage';

export default function ProductsPage({
  preferredStoreId = null,
  hideTitle = false,
  catalogProfile = null,
} = {}) {
  const p = useProductsPage({ preferredStoreId, catalogProfile });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="admin-page-title text-xl">{p.t('products.title')}</h1>
          </div>
        )}
        <ProductsToolbar
          canManage={p.manage}
          catalogProfile={catalogProfile}
          onAdd={p.handleAddProduct}
          onImport={() => p.setImportOpen(true)}
          onExport={() => p.setExportOpen(true)}
          onBulkVat={p.openBulkVat}
          onDeleteAll={p.openBulkDelete}
          onOpenFilters={() => p.setFiltersOpen(true)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <ProductsSearchField
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('products.searchNamePh')}
        />
      </div>

      <div className="rst-products-table-shell admin-table-shell">
        <ProductsTable
          t={p.t}
          isLoading={p.isLoading}
          data={p.data}
          page={p.page}
          pageSize={p.pageSize}
          pageSizeOptions={p.pageSizeOptions}
          total={p.total}
          totalPages={p.totalPages}
          onPageChange={p.setPage}
          onPageSizeChange={p.setPageSize}
          selectedIds={p.selectedIds}
          toggleSelect={p.toggleSelect}
          allPageSelected={p.allPageSelected}
          somePageSelected={p.somePageSelected}
          toggleSelectAllPage={p.toggleSelectAllPage}
          selectAllRef={p.selectAllRef}
          catalogProfile={catalogProfile}
          onOpenRowMenu={(product, rect) =>
            p.setRowMenu((cur) => (cur?.product?.id === product.id ? null : { product, rect }))
          }
        />
      </div>

      <ProductsModals p={p} />
    </div>
  );
}
