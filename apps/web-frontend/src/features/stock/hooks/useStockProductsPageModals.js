import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { productApi } from '../../../api';

export function useStockProductsPageModals({ stores, preferredStoreId, invalidateCaches, t }) {
  const [rowMenu, setRowMenu] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [receiveProduct, setReceiveProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [infoProductId, setInfoProductId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStore, setCreateStore] = useState(null);

  const resolveCreateStore = useCallback(() => {
    if (preferredStoreId != null) {
      const preferred = stores.find((store) => Number(store.id) === Number(preferredStoreId));
      if (preferred) return preferred;
    }
    return stores[0] ?? null;
  }, [preferredStoreId, stores]);

  const handleAddProduct = useCallback(() => {
    if (stores.length === 0) {
      toast.error(t('productTemplates.noStoresHint'));
      return;
    }
    setEditProduct(null);
    setCreateStore(resolveCreateStore());
    setShowCreate(true);
  }, [stores, resolveCreateStore, t]);

  const handleCreateStoreChange = useCallback((store) => {
    if (!createStore || !store || store.id === createStore.id) return;
    setCreateStore(store);
  }, [createStore]);

  const closeCatalogModal = useCallback(() => {
    setEditProduct(null);
    setShowCreate(false);
    setCreateStore(null);
  }, []);

  const confirmDelete = async () => {
    if (!deleteProduct) return;
    try {
      await productApi.deactivate(deleteProduct.id);
      toast.success(t('products.deactivated'));
      invalidateCaches();
      setDeleteProduct(null);
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('productModal.saveFailed'));
    }
  };

  const openRowMenu = (product, rect) => {
    setRowMenu((cur) => (cur?.product?.id === product.id ? null : { product, rect }));
  };

  const closeRowMenu = () => setRowMenu(null);

  const onSelectEditProduct = (product) => {
    setShowCreate(false);
    setCreateStore(null);
    setEditProduct(product);
  };

  return {
    rowMenu,
    setRowMenu,
    editProduct,
    setEditProduct: onSelectEditProduct,
    stockProduct,
    setStockProduct,
    receiveProduct,
    setReceiveProduct,
    deleteProduct,
    setDeleteProduct,
    infoProductId,
    setInfoProductId,
    showCreate,
    createStore,
    handleAddProduct,
    handleCreateStoreChange,
    closeCatalogModal,
    confirmDelete,
    openRowMenu,
    closeRowMenu,
    catalogModalKey: editProduct?.id ?? (showCreate ? `new-${createStore?.id ?? 'x'}` : 'closed'),
  };
}
