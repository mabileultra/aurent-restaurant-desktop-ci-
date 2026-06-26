import { useState } from 'react';
import toast from 'react-hot-toast';

export function useProductsPageCreateFlow({ t, activeStores }) {
  const [editProduct, setEditProduct] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStore, setCreateStore] = useState(null);

  const resetCreateFlow = () => {
    setShowCreate(false);
    setCreateStore(null);
  };

  const startCreateFlow = (store) => {
    setCreateStore(store);
    setShowCreate(true);
  };

  const handleAddProduct = () => {
    if (activeStores.length === 0) {
      toast.error(t('productTemplates.noStoresHint'));
      return;
    }
    resetCreateFlow();
    startCreateFlow(activeStores[0]);
  };

  const handleCreateStoreChange = (store) => {
    if (!createStore || !store || store.id === createStore.id) return;
    setCreateStore(store);
  };

  const closeCatalogModal = () => {
    if (editProduct) {
      setEditProduct(null);
    } else {
      resetCreateFlow();
    }
  };

  const catalogModalKey = editProduct?.id ?? `new-${createStore?.id ?? 'x'}`;

  return {
    editProduct,
    setEditProduct,
    showCreate,
    createStore,
    handleAddProduct,
    handleCreateStoreChange,
    closeCatalogModal,
    resetCreateFlow,
    catalogModalKey,
  };
}
