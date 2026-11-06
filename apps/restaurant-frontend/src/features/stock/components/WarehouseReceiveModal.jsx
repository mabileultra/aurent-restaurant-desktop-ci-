import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi, warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { formatQty, parseQtyInput, roundQty } from '../../../utils/quantityFormat';
import { getUnitConfig } from '../../../utils/unitConfig';
import { BaseSelect, BaseButton } from '../../../components/ui';
import { ProductLookupSelect } from '../../../components/product-lookup';
import '../styles/stock-adjust-modal.css';
import { toastApiError } from '../../../utils/apiError';

export default function WarehouseReceiveModal({
  open,
  onClose,
  initialProduct,
  preferredStoreId,
  onSaved,
}) {
  const { t } = useTranslation();
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
    if (preferredStoreId != null && preferredStoreId !== '') {
      setStoreId(String(preferredStoreId));
      return;
    }
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [preferredStoreId, onlyStore]);

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
    if (selectedProduct.storageLocation) setStorageLocation(selectedProduct.storageLocation);
  }, [open, selectedProduct?.id, selectedProduct?.sellingPrice, selectedProduct?.costPrice]);

  const unitCode = selectedProduct?.unitCode || 'PCS';
  const saleType = selectedProduct?.saleType || 'PIECE';
  const unitConfig = getUnitConfig(unitCode);
  const currentStock = selectedProduct?.stockQuantity ?? 0;
  const parsedReceiveQty = parseQtyInput(quantity, saleType, unitCode);
  const afterStock = useMemo(() => {
    if (parsedReceiveQty == null) return null;
    const sum = Number(currentStock) + parsedReceiveQty;
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
      toastApiError(err, t('stockModule.receiveFail'));
    },
  });

  if (!open) return null;

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
    if (vat === '0' || vat === '12') body.vatPercent = Number(vat);
    mutation.mutate(body);
  };

  return (
    <div className="rst-stock-receive">
      <button type="button" className="rst-stock-receive__backdrop" aria-label="Close" onClick={onClose} />
      <div className="rst-stock-receive__panel" role="dialog" aria-modal="true">
        <div className="rst-stock-receive__head">
          <h2>{t('stockModule.modal.title')}</h2>
          <button type="button" onClick={onClose} className="rst-stock-receive__close">
            <X size={20} aria-hidden />
          </button>
        </div>
        <form onSubmit={submit} className="rst-stock-receive__form">
          <p className="rst-stock-receive__hint">{t('stockModule.modal.sharedHint')}</p>

          {productId ? (
            <p className="rst-stock-receive__stock">
              {t('stockModule.modal.currentStock', {
                qty: formatQty(currentStock, saleType, unitCode),
              })}
              {afterStock != null ? (
                <span>
                  {' '}
                  {t('stockModule.modal.afterReceive', {
                    qty: formatQty(afterStock, saleType, unitCode),
                  })}
                </span>
              ) : null}
            </p>
          ) : null}

          {needsStorePick && preferredStoreId == null ? (
            <BaseSelect
              label={t('stockReports.colStore')}
              required
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder={t('stockModal.pickStore')}
              options={[
                { value: '', label: t('stockModal.pickStore') },
                ...stores.map((s) => ({ value: String(s.id), label: s.name })),
              ]}
            />
          ) : null}

          <ProductLookupSelect
            source="warehouse"
            label={t('stockModule.modal.product')}
            required
            value={productId}
            onChange={setProductId}
            storeId={effectiveStoreId}
            disabled={lockedProduct || !effectiveStoreId}
            showStockInList
          />

          <label className="rst-stock-receive__field">
            <span>{t('stockModule.modal.qty')}</span>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('stockModule.modal.qtyPh')}
              required
            />
          </label>

          <div className="rst-stock-receive__row">
            <label className="rst-stock-receive__field">
              <span>{t('stockModule.modal.unitPrice')}</span>
              <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
            </label>
            <label className="rst-stock-receive__field">
              <span>{t('stockModule.modal.purchase')}</span>
              <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required />
            </label>
          </div>

          <BaseSelect
            label={t('stockModule.modal.vat')}
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            options={[
              { value: '', label: t('stockModule.modal.vatUnset') },
              { value: '0', label: t('stockModule.modal.vat0') },
              { value: '12', label: t('stockModule.modal.vat12') },
            ]}
          />

          <label className="rst-stock-receive__field">
            <span>{t('stockModule.modal.location')}</span>
            <input
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder={t('stockModule.modal.locationPh')}
            />
          </label>

          <label className="rst-stock-receive__check">
            <input type="checkbox" checked={marked} onChange={(e) => setMarked(e.target.checked)} />
            <span>{t('stockModule.modal.marking')}</span>
          </label>

          <div className="rst-stock-receive__actions">
            <BaseButton type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </BaseButton>
            <BaseButton type="submit" disabled={mutation.isPending || !effectiveStoreId}>
              {t('stockModule.modal.submit')}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
