import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../../../store/cartStore';
import {
  applyMarkingScan,
  assessMarkLifecycle,
  markingIdentityKeys,
  preserveMarkingCodeForFiscal,
} from '../../../marking';
import { resolvePosMarkedProduct } from '../../utils/resolvePosMarkedProduct';
import { classifyPosScanInput } from '../../utils/classifyPosScanInput';
import { resolveForbiddenMxikError } from '../../utils/resolveForbiddenMxikError';

export function usePosMarkingScan({
  storeId,
  cashRegisterId,
  shiftIsOpen,
  payOpen,
  returnOpen,
  products,
  cartProductPayload,
  showLineAddedToast,
  setSelectedLineId,
  setSearch,
  searchInputRef,
  scanningRef,
  t,
}) {
  const pendingMarkKeysRef = useRef(new Set());

  const addMarkedScanToCart = useCallback(
    (product) => {
      if (!shiftIsOpen) {
        toast.error(t('pos.shiftRequired'));
        return null;
      }
      if (product.active === false) {
        toast.error(t('pos.productInactive'));
        return null;
      }
      const payload = cartProductPayload(product);
      if (Number(payload.stockQuantity) <= 0 && (product.saleType || 'PIECE') !== 'SERVICE') {
        toast.error(t('pos.outOfStock'));
        return null;
      }
      let result;
      try {
        result = applyMarkingScan(payload, product.productMark || product.markCode);
      } catch (err) {
        const msg = resolveForbiddenMxikError(err, t);
        toast.error(msg || err?.message || t('pos.saleFailed'));
        return null;
      }
      if (result.status === 'duplicate') {
        toast.error(t('pos.markingAlreadyCounted'));
        return result;
      }
      if (result.status === 'stock') {
        toast.error(t('pos.outOfStock'));
        return result;
      }
      if (result.status !== 'added') return result;
      const line = useCartStore.getState().items.find((i) => i.lineId === result.lineId);
      if (line) showLineAddedToast(line, product.name);
      setSelectedLineId(result.lineId);
      setSearch('');
      return result;
    },
    [cartProductPayload, shiftIsOpen, showLineAddedToast, t, setSearch, setSelectedLineId]
  );

  const tryAddByMarking = useCallback(
    async (rawCode) => {
      if (!rawCode || !storeId || payOpen || returnOpen) return false;
      if (classifyPosScanInput(rawCode) !== 'marking') return false;
      if (scanningRef.current) return true;
      if (!shiftIsOpen) {
        toast.error(t('pos.shiftRequired'));
        return true;
      }
      const mark = preserveMarkingCodeForFiscal(rawCode);
      const before = assessMarkLifecycle({
        rawCode: mark,
        cartItems: useCartStore.getState().items,
        pendingKeys: [...pendingMarkKeysRef.current],
        storeId,
      });
      if (before.status === 'duplicate') {
        toast.error(t('pos.markingAlreadyCounted'));
        setSearch('');
        return true;
      }

      scanningRef.current = true;
      const keys = markingIdentityKeys(mark);
      keys.forEach((k) => pendingMarkKeysRef.current.add(k));
      try {
        const resolved = await resolvePosMarkedProduct({
          products,
          rawCode: mark,
          storeId,
          cashRegisterId,
        });
        if (resolved.status === 'sold') {
          toast.error(t('pos.markingSoldLocal'), { id: 'pos-marking-scan' });
          setSearch('');
          return true;
        }
        if (resolved.status === 'withdrawn') {
          toast.error(resolved.message || t('pos.markingNotInCirculation'), { id: 'pos-marking-scan' });
          setSearch('');
          return true;
        }
        if (resolved.status === 'ok' && resolved.product) {
          if (resolved.circulation === 'in-circulation') {
            toast.success(t('pos.markingInCirculation'), { id: 'pos-marking-scan' });
          }
          addMarkedScanToCart(resolved.product);
          setSearch('');
          return true;
        }
        toast.error(t('pos.markingNotFound'), { id: 'pos-marking-scan' });
        setSearch('');
        return true;
      } catch (e) {
        toast.error(t(e?.code === 'MARK_ALREADY_SOLD'
          ? 'pos.markingAlreadySold'
          : 'pos.markingNotFound'), { id: 'pos-marking-scan' });
        setSearch('');
        return true;
      } finally {
        keys.forEach((k) => pendingMarkKeysRef.current.delete(k));
        scanningRef.current = false;
        searchInputRef.current?.focus();
      }
    },
    [
      addMarkedScanToCart,
      cashRegisterId,
      payOpen,
      products,
      returnOpen,
      scanningRef,
      searchInputRef,
      setSearch,
      shiftIsOpen,
      storeId,
      t,
    ]
  );

  return {
    addMarkedScanToCart,
    tryAddByMarking,
  };
}
