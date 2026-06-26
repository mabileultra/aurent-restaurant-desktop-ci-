import { lazy } from 'react';
import LazyModalSuspense from './LazyModalSuspense';

const ProductCatalogModal = lazy(() => import('../ProductCatalogModal'));

export default function ProductsCatalogModals({ p }) {
  const visible = p.showCreate || !!p.editProduct;

  return (
    <LazyModalSuspense when={visible}>
      {visible ? (
        <ProductCatalogModal
          key={p.catalogModalKey}
          product={p.editProduct}
          categories={p.categories}
          stores={p.activeStores}
          selectedStore={p.editProduct ? null : p.createStore}
          onCreateStoreChange={p.handleCreateStoreChange}
          onClose={p.closeCatalogModal}
          onSaved={p.onCatalogSaved}
        />
      ) : null}
    </LazyModalSuspense>
  );
}
