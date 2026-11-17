import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productApi, warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { parseQtyInput, roundQty } from '../../../utils/quantityFormat';
import { getUnitConfig } from '../../../utils/unitConfig';

export function useWarehouseReceiveForm({ open, initialProduct, onSaved, onClose, t }) {
  const qc = useQueryClient();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [vat, setVat] = useState('');
  const [marked, setMarked] = useState(false);
  const [storageLocation, setStorageLocation] = useState('');
  const [storeId, setStoreId] = useState('');
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  useEffect(() => {
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  useEffect(() => {
    if (!open) return;
    setProductId(initialProduct?.id ?? '');
    setQuantity('');
    setUnitPrice('');
    setPurchasePrice('');
    setVat('');
    setMarked(false);
    setStorageLocation('');
  }, [open, initialProduct?.id]);

  const lockedProduct = !!initialProduct?.id;

  const { data: selectedProduct } = useQuery({
    queryKey: ['products', productId, effectiveStoreId],
    queryFn: () =>
      productApi
        .getById(productId, effectiveStoreId ? { storeId: effectiveStoreId } : undefined)
        .then((r) => r.data),
    enabled: open && !!productId && (!needsStorePick || !!effectiveStoreId),
  });

  useEffect(() => {
    if (!open || !selectedProduct) return;
    setUnitPrice(String(selectedProduct.sellingPrice ?? ''));
    setPurchasePrice(String(selectedProduct.costPrice ?? ''));
    const tr = selectedProduct.taxRate;
    if (tr === 0 || tr === '0') setVat('0');
    else if (Number(tr) === 12) setVat('12');
    setMarked(!!selectedProduct.markedProduct);
    if (selectedProduct.storageLocation) {
      setStorageLocation(selectedProduct.storageLocation);
    }
  }, [open, selectedProduct]);

  const unitCode = selectedProduct?.unitCode || 'PCS';
  const saleType = selectedProduct?.saleType || 'PIECE';
  const unitConfig = getUnitConfig(unitCode);
  const currentStock = selectedProduct?.stockQuantity ?? 0;
  const parsedReceiveQty = parseQtyInput(quantity, saleType, unitCode);
  const afterStock = useMemo(() => {
    if (parsedReceiveQty == null) return null;
    const sum = currentStock + parsedReceiveQty;
    return unitConfig.scale === 0 ? Math.round(sum) : roundQty(sum);
  }, [currentStock, parsedReceiveQty, unitConfig.scale]);

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.receipt(body),
    onSuccess: () => {
      toast.success(t('stockModule.receiveOk'));
      invalidateProductCaches(qc);
      onSaved?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('stockModule.receiveFail'));
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (!productId) {
      toast.error(t('validation.fieldRequired', { field: t('stockModule.modal.product') }));
      return;
    }
    const q = parseQtyInput(quantity, saleType, unitCode);
    if (q == null) {
      toast.error(t('validation.fieldRequired', { field: t('stockModule.modal.qty') }));
      return;
    }
    const sell = Number(String(unitPrice).replace(',', '.'));
    const buy = Number(String(purchasePrice).replace(',', '.'));
    if (!Number.isFinite(sell) || sell < 0) {
      toast.error(t('validation.fieldRequired', { field: t('stockModule.modal.unitPrice') }));
      return;
    }
    if (!Number.isFinite(buy) || buy < 0) {
      toast.error(t('validation.fieldRequired', { field: t('stockModule.modal.purchase') }));
      return;
    }
    const sid = resolveStoreId(storeId);
    if (!sid) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    const body = {
      productId,
      storeId: sid,
      quantity: q,
      unitSellingPrice: sell,
      purchasePrice: buy,
      markedProduct: marked,
      storageLocation: storageLocation.trim() || null,
    };
    if (vat === '0' || vat === '12') {
      body.vatPercent = Number(vat);
    }
    mutation.mutate(body);
  };

  return {
    productId,
    setProductId,
    quantity,
    setQuantity,
    unitPrice,
    setUnitPrice,
    purchasePrice,
    setPurchasePrice,
    vat,
    setVat,
    marked,
    setMarked,
    storageLocation,
    setStorageLocation,
    storeId,
    setStoreId,
    stores,
    needsStorePick,
    effectiveStoreId,
    lockedProduct,
    selectedProduct,
    unitCode,
    saleType,
    unitConfig,
    currentStock,
    afterStock,
    mutation,
    submit,
  };
}
