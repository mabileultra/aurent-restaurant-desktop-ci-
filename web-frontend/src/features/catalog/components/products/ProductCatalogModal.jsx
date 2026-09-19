import { useProductCatalogForm } from '../../hooks/useProductCatalogForm';
import ProductCatalogModalHeader from './catalog/ProductCatalogModalHeader';
import ProductCatalogModalFormBody from './catalog/ProductCatalogModalFormBody';
import ProductCatalogModalFooter from './catalog/ProductCatalogModalFooter';

export default function ProductCatalogModal({
  product,
  categories,
  stores,
  onClose,
  onSaved,
  selectedStore = null,
  onCreateStoreChange,
  catalogProfile = null,
}) {
  const form = useProductCatalogForm(product, stores, onSaved, {
    selectedStoreId: selectedStore?.id ?? null,
    selectedStoreBusinessType: selectedStore?.businessType ?? null,
    catalogProfile,
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <ProductCatalogModalHeader
          t={form.t}
          isEdit={form.isEdit}
          onClose={onClose}
          catalogProfile={catalogProfile}
        />

        <form onSubmit={form.handleSubmit(form.onSubmit)} className="p-5 space-y-5">
          <ProductCatalogModalFormBody
            form={form}
            categories={categories}
            stores={stores}
            selectedStore={selectedStore}
            onCreateStoreChange={onCreateStoreChange}
          />

          <ProductCatalogModalFooter
            t={form.t}
            isEdit={form.isEdit}
            isPending={form.isPending}
            onClose={onClose}
          />
        </form>
      </div>
    </div>
  );
}
