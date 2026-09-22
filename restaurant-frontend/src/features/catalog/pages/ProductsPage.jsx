import { Plus } from 'lucide-react';
import { BaseButton, ErrorBanner, PageSearchField } from '../../../components/ui';
import { CATALOG_PROFILE_RESTAURANT_INGREDIENT } from '../../../config/productCatalogConfig';
import { useIngredientsPage } from '../hooks/useIngredientsPage';
import IngredientsTable from '../components/products/IngredientsTable';
import IngredientsToolbarActions from '../components/products/IngredientsToolbarActions';
import IngredientModal from '../components/products/IngredientModal';
import IngredientRowMenu from '../components/products/IngredientRowMenu';
import IngredientDeleteModal from '../components/products/IngredientDeleteModal';
import IngredientBulkDeleteModal from '../components/products/IngredientBulkDeleteModal';
import IngredientExportModal from '../components/products/IngredientExportModal';
import IngredientImportModal from '../components/products/IngredientImportModal';
import NomenclatureTypeTabs from '../components/products/NomenclatureTypeTabs';
import '../styles/ingredients-page.css';
import '../styles/ingredients-toolbar.css';

export default function ProductsPage({
  preferredStoreId = null,
  hideTitle = false,
  catalogProfile = null,
} = {}) {
  const isIngredient = catalogProfile === CATALOG_PROFILE_RESTAURANT_INGREDIENT
    || catalogProfile == null;
  const p = useIngredientsPage({ preferredStoreId });

  if (!isIngredient) {
    return <ErrorBanner message="Unsupported catalog profile" />;
  }

  return (
    <div className="rst-ingredients">
      <div className="rst-ingredients__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{p.t('rst.nomenclature.title')}</h1>
            <p className="rst-coming__text mb-0">{p.t('rst.nomenclature.subtitle')}</p>
          </div>
        )}
        <div className="rst-ingredients__toolbar-right">
          <IngredientsToolbarActions
            t={p.t}
            manage={p.manage}
            columnDefs={p.columnDefs}
            visible={p.visibleColumns}
            onToggleColumn={p.toggleColumn}
            onImport={() => p.setImportOpen(true)}
            onExport={() => p.setExportOpen(true)}
            selectedCount={p.selectedIds.size}
            onBulkDelete={() => p.setBulkDeleteOpen(true)}
          />
          {p.manage ? (
            <BaseButton type="button" onClick={p.handleAdd}>
              <Plus size={16} aria-hidden />
              {p.t('rst.nomenclature.add')}
            </BaseButton>
          ) : null}
        </div>
      </div>

      {p.selectedIds.size > 0 ? (
        <div className="rst-ing-bulk-bar">
          <p className="rst-ing-bulk-bar__count">
            {p.t('rst.nomenclature.selectedCount', { count: p.selectedIds.size })}
          </p>
          <div className="rst-ing-bulk-bar__actions">
            <BaseButton type="button" variant="ghost" onClick={p.clearSelection}>
              {p.t('rst.nomenclature.clearSelection')}
            </BaseButton>
            <BaseButton type="button" variant="danger" onClick={() => p.setBulkDeleteOpen(true)}>
              {p.t('rst.nomenclature.bulkDelete', { count: p.selectedIds.size })}
            </BaseButton>
          </div>
        </div>
      ) : null}

      <div className="rst-ingredients__filters">
        <NomenclatureTypeTabs value={p.typeTab} onChange={p.handleTypeTab} t={p.t} />
        <PageSearchField
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('rst.nomenclature.searchPh')}
        />
      </div>

      {p.isError ? <ErrorBanner message={p.errorMessage} /> : null}

      <IngredientsTable
        t={p.t}
        isLoading={p.isLoading}
        rows={p.rows}
        page={p.page}
        pageSize={p.pageSize}
        pageSizeOptions={p.pageSizeOptions}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        manage={p.manage}
        onOpenRowMenu={p.openRowMenu}
        visibleDefs={p.visibleDefs}
        selection={p.manage ? {
          selectedIds: p.selectedIds,
          selectAllRef: p.selectAllRef,
          allPageSelected: p.allPageSelected,
          toggleSelect: p.toggleSelect,
          toggleSelectAllPage: p.toggleSelectAllPage,
        } : null}
      />

      <IngredientModal
        open={p.showCreate || !!p.editProduct}
        product={p.editProduct}
        categories={p.categories}
        selectedStore={p.createStore}
        defaultProductType={p.createDefaultType}
        onClose={p.closeModal}
        onSaved={p.invalidate}
      />

      <IngredientRowMenu
        menu={p.rowMenu}
        t={p.t}
        manage={p.manage}
        onClose={p.closeRowMenu}
        onEdit={p.setEditProduct}
        onDelete={p.setDeleteProduct}
      />

      <IngredientDeleteModal
        t={p.t}
        product={p.deleteProduct}
        onClose={() => p.setDeleteProduct(null)}
        onConfirm={p.confirmDelete}
      />

      {p.bulkDeleteOpen ? (
        <IngredientBulkDeleteModal
          t={p.t}
          productIds={p.selectedIds}
          onClose={() => p.setBulkDeleteOpen(false)}
          onDone={() => {
            p.clearSelection();
            p.setBulkDeleteOpen(false);
          }}
        />
      ) : null}

      {p.exportOpen ? (
        <IngredientExportModal
          t={p.t}
          stores={p.stores}
          onClose={() => p.setExportOpen(false)}
        />
      ) : null}

      {p.importOpen ? (
        <IngredientImportModal
          t={p.t}
          defaultStoreId={p.createStore?.id ?? p.storeId}
          onClose={() => p.setImportOpen(false)}
          onDone={p.invalidate}
        />
      ) : null}
    </div>
  );
}
