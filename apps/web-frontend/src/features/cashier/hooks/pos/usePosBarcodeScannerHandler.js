import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useBarcodeScanner } from '../../../../hooks/useBarcodeScanner';
import { findProductBarcode, findProductByIkpu, withScannedBarcode } from '../../utils/productBarcodeMatch';
import { posFetchFirstProductByBarcode } from '../../utils/posFetchFirstProductByBarcode';
import { rememberPosBarcodeHit } from '../../utils/posBarcodeHitCache';
import { resolveBarcodeFromLoadedProducts } from '../../utils/resolveBarcodeFromLoadedProducts';
import { tryResolveWeightPluProduct } from '../../utils/tryResolveWeightPluProduct';
import { posBarcodeCandidates } from '../../utils/posBarcodeCandidates';
import { classifyPosScanInput } from '../../utils/classifyPosScanInput';
import { canAddProductFromSearchList } from './posProductsSearchStale';
import { useCartStore } from '../../../../store/cartStore';
import { resolveForbiddenMxikError } from '../../utils/resolveForbiddenMxikError';

export function usePosBarcodeScannerHandler({
  storeId,
  payOpen,
  returnOpen,
  shiftIsOpen,
  shiftModalOpen,
  products,
  productsStale,
  search,
  setSearch,
  searchInputRef,
  scanningRef,
  scanQueueRef,
  addProductToCart,
  addWeightLine,
  cartProductPayload,
  showLineAddedToast,
  setSelectedLineId,
  tryAddByMarking,
  t,
}) {
  const tryAddByBarcode = useCallback(
    async (code, { silent = false } = {}) => {
      const trimmed = String(code || '').trim();
      if (!trimmed || !storeId || payOpen || returnOpen) return false;

      if (classifyPosScanInput(trimmed) === 'marking') {
        await tryAddByMarking(trimmed);
        return true;
      }

      scanningRef.current = true;
      try {
        const localHit = resolveBarcodeFromLoadedProducts(products, trimmed);
        if (localHit?.product) {
          rememberPosBarcodeHit(storeId, posBarcodeCandidates(trimmed), localHit.product);
          addProductToCart(withScannedBarcode(localHit.product, localHit.code));
          setSearch('');
          return true;
        }

        const [weightHit, barcodeHit] = await Promise.all([
          tryResolveWeightPluProduct(trimmed, storeId),
          posFetchFirstProductByBarcode(storeId, trimmed),
        ]);

        if (weightHit?.product) {
          if (!shiftIsOpen) {
            toast.error(t('pos.shiftRequired'));
            return false;
          }
          if (!weightHit.product.active) {
            toast.error(t('pos.productInactive'));
            return false;
          }
          const payload = cartProductPayload(weightHit.product);
          let lineId;
          try {
            lineId = addWeightLine(payload, weightHit.weightKg);
          } catch (err) {
            const msg = resolveForbiddenMxikError(err, t);
            toast.error(msg || err?.message || t('pos.saleFailed'));
            setSearch('');
            return true;
          }
          const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
          if (line) showLineAddedToast(line, weightHit.product.name);
          if (lineId) setSelectedLineId(lineId);
          setSearch('');
          return true;
        }

        if (barcodeHit?.product) {
          addProductToCart(withScannedBarcode(barcodeHit.product, barcodeHit.code));
          setSearch('');
          return true;
        }
        if (!silent) toast.error(t('pos.barcodeNotFound'));
        return false;
      } catch (e) {
        if (!silent) toast.error(e.response?.data?.message ?? t('pos.barcodeNotFound'));
        return false;
      } finally {
        scanningRef.current = false;
        searchInputRef.current?.focus();
      }
    },
    [
      storeId,
      products,
      addProductToCart,
      addWeightLine,
      cartProductPayload,
      payOpen,
      returnOpen,
      shiftIsOpen,
      showLineAddedToast,
      t,
      setSearch,
      searchInputRef,
      setSelectedLineId,
      tryAddByMarking,
      scanningRef,
    ]
  );

  const enqueueScan = useCallback(
    (code, opts) => scanQueueRef.current.enqueue(code, opts, tryAddByBarcode),
    [tryAddByBarcode, scanQueueRef]
  );

  useBarcodeScanner({
    enabled: !!storeId && !payOpen && !shiftModalOpen && !returnOpen,
    barcodeInputRef: searchInputRef,
    onScan: (code) => enqueueScan(code),
    alwaysCapture: true,
  });

  const handleSearchEnter = useCallback(async () => {
    const q = search.trim();
    if (!q) return;
    if (await tryAddByBarcode(q, { silent: true })) return;
    if (!canAddProductFromSearchList({ productsStale, products })) {
      if (productsStale) return;
      toast.error(t('pos.barcodeNotFound'));
      return;
    }
    const lower = q.toLowerCase();
    const byBarcode = products.find((p) => findProductBarcode(p, q));
    const byIkpu = products.find((p) => findProductByIkpu(p, q));
    const exact =
      (byBarcode && withScannedBarcode(byBarcode, q)) ||
      byIkpu ||
      products.find((p) => p.sku?.toLowerCase() === lower) ||
      products.find((p) => p.name?.toLowerCase() === lower);
    addProductToCart(exact ?? products[0]);
    setSearch('');
  }, [search, products, productsStale, tryAddByBarcode, addProductToCart, t, setSearch]);

  return {
    tryAddByBarcode,
    enqueueScan,
    handleSearchEnter,
  };
}
