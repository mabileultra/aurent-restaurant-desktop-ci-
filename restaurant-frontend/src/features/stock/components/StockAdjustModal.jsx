import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { BaseSelect, BaseButton } from '../../../components/ui';
import '../styles/stock-adjust-modal.css';
import { toastApiError } from '../../../utils/apiError';

export default function StockAdjustModal({ product, preferredStoreId, onClose, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();
  const [storeId, setStoreId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [movementType, setMovementType] = useState('ADJUSTMENT');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (preferredStoreId != null && preferredStoreId !== '') {
      setStoreId(String(preferredStoreId));
      return;
    }
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [preferredStoreId, onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  const { data: productAtStore } = useQuery({
    queryKey: ['product-stock', product.id, effectiveStoreId],
    queryFn: () => productApi.getById(product.id, { storeId: effectiveStoreId }).then((r) => r.data),
    enabled: !!effectiveStoreId,
  });

  const displayQty = productAtStore?.stockQuantity ?? product.stockQuantity;

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const sid = resolveStoreId(storeId);
      if (!sid) return Promise.reject(new Error(t('stockModal.storeRequired')));
      const qty = Number(String(quantity).replace(',', '.'));
      if (!Number.isFinite(qty) || qty === 0) {
        return Promise.reject(new Error(t('validation.nonZeroQty')));
      }
      return productApi.adjustStock(product.id, qty, movementType, notes || undefined, sid);
    },
    onSuccess: () => {
      toast.success(t('stockModal.stockUpdated'));
      invalidateProductCaches(qc);
      onSaved?.();
      onClose();
    },
    onError: (err) =>
      toastApiError(err, err.message ?? t('stockModal.adjustFailed')),
  });

  return (
    <div className="rst-stock-adjust">
      <button type="button" className="rst-stock-adjust__backdrop" aria-label="Close" onClick={onClose} />
      <div className="rst-stock-adjust__panel" role="dialog" aria-modal="true">
        <div className="rst-stock-adjust__head">
          <div>
            <h2>{t('stockModal.title')}</h2>
            <p>{product.name}</p>
            <p className="rst-stock-adjust__meta">
              {t('stockModal.current', { qty: displayQty })}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rst-stock-adjust__close">
            <X size={20} aria-hidden />
          </button>
        </div>

        <form
          className="rst-stock-adjust__form"
          onSubmit={(e) => {
            e.preventDefault();
            mutate();
          }}
        >
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

          <label className="rst-stock-adjust__field">
            <span>{t('stockModal.qtyChange')}</span>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('stockModal.qtyPh')}
              required
            />
            <small>{t('stockModal.qtyHint')}</small>
          </label>

          <BaseSelect
            label={t('stockModal.movement')}
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            options={[
              { value: 'RESTOCK', label: t('stockModal.restock') },
              { value: 'ADJUSTMENT', label: t('stockModal.adjustment') },
              { value: 'RETURN', label: t('stockModal.return') },
            ]}
          />

          <label className="rst-stock-adjust__field">
            <span>{t('stockModal.notes')}</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('stockModal.notesPh')}
            />
          </label>

          <div className="rst-stock-adjust__actions">
            <BaseButton type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </BaseButton>
            <BaseButton type="submit" disabled={isPending || !effectiveStoreId}>
              {isPending ? <Loader size={16} className="animate-spin" aria-hidden /> : null}
              {t('common.apply')}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
