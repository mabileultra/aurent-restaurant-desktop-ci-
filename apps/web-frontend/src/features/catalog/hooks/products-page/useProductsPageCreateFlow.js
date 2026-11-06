import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

export function useProductsPageCreateFlow({ t, activeStores, preferredStoreId = null }) {
  const [searchParams, setSearchParams] = useSearchParams();
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
    const preferred = preferredStoreId != null
      ? activeStores.find((store) => Number(store.id) === Number(preferredStoreId))
      : null;
    startCreateFlow(preferred ?? activeStores[0]);
  };

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    if (activeStores.length === 0) return;
    const preferred = preferredStoreId != null
      ? activeStores.find((store) => Number(store.id) === Number(preferredStoreId))
      : null;
    setEditProduct(null);
    startCreateFlow(preferred ?? activeStores[0]);
    const next = new URLSearchParams(searchParams);
    next.delete('create');
    setSearchParams(next, { replace: true });
  }, [activeStores, preferredStoreId, searchParams, setSearchParams]);

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
