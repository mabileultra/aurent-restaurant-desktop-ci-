import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { posFetchProductByBarcode } from '../../../../services/pos/posDataRouter';
import { findProductBarcode, withScannedBarcode } from '../../utils/productBarcodeMatch';
import { scalesApi } from '../../../../api/scales.api';
import { decodeWeightBarcode } from '../../../scales/utils/weightBarcode';
import { useBarcodeScanner } from '../../../../hooks/useBarcodeScanner';
import { lineSubtotal, useCartStore } from '../../../../store/cartStore';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { isMeasuredProduct, minQtyForUnit, qtyStepForUnit, roundQty } from '../../../../utils/quantityFormat';
import { getUnitConfig } from '../../../../utils/unitConfig';
import { resolveProductUnitPrice } from '../../../../utils/productPrice';
import { canAddProductFromSearchList } from './posProductsSearchStale';
import {
  applyMarkingScan,
  assessMarkLifecycle,
  markingIdentityKeys,
  preserveMarkingCodeForFiscal,
} from '../../../marking';
import { resolvePosMarkedProduct } from '../../utils/resolvePosMarkedProduct';
import { classifyPosScanInput } from '../../utils/classifyPosScanInput';

export function usePosCartHandlers({
  storeId,
  shiftIsOpen,
  payOpen,
  returnOpen,
  shiftModalOpen,
  searchInputRef,
  products,
  productsStale = false,
  search,
  setSearch,
  addPieceItem,
  addWeightLine,
  updateQuantity,
  updateUnitPrice,
  removeItem,
  selectedLineId,
  setSelectedLineId,
  aslMarkingEnabled = false,
  cashRegisterId = null,
}) {
  const { t } = useTranslation();
  const scanningRef = useRef(false);
  const pendingMarkKeysRef = useRef(new Set());
  const [weightModalProduct, setWeightModalProduct] = useState(null);
  const [weightEditLineId, setWeightEditLineId] = useState(null);

  const cartProductPayload = useCallback(
    (product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode ?? null,
      ikpu: product.ikpu ?? null,
      packageCode: product.packageCode ?? null,
      unitMeasureCode: product.unitMeasureCode ?? null,
      unitOfMeasure: product.unitOfMeasure ?? null,
      commissionTin: product.commissionTin ?? null,
      attributes: product.attributes ?? null,
      saleType: product.saleType || 'PIECE',
      unitCode: product.unitCode,
      quantityScale: product.quantityScale,
      allowFraction: product.allowFraction,
      costPrice: Number(product.costPrice ?? 0),
      sellingPrice: resolveProductUnitPrice(product, storeId),
      defaultDiscountPercent: Number(product.defaultDiscountPercent ?? 0),
      taxRate: Number(product.taxRate ?? 12),
      stockQuantity: Number(product.stockQuantity ?? 0),
      markedProduct: product.markedProduct === true,
      productMark: product.productMark ?? product.markCode ?? null,
      markCode: product.markCode ?? product.productMark ?? null,
      productMarks: Array.isArray(product.productMarks) ? [...product.productMarks] : null,
    }),
    [storeId]
  );

  const showLineAddedToast = useCallback(
    (line, productName) => {
      toast.success(
        <div className="pos-item-added-toast">
          <p className="pos-item-added-toast__name" title={productName}>{productName}</p>
          <p className="pos-item-added-toast__sum">{fmt(lineSubtotal(line))}</p>
        </div>,
        {
          duration: 1400,
          className: 'pos-item-added-toast-host',
          ariaLabel: t('pos.itemAdded', {
            name: productName,
            sum: fmt(lineSubtotal(line)),
          }),
        }
      );
    },
    [t]
  );

  const openWeightModalForLine = useCallback((item) => {
    setWeightEditLineId(item.lineId);
    setWeightModalProduct({
      id: item.productId,
      name: item.name,
      sku: item.sku,
      saleType: 'WEIGHT',
      unitCode: item.unitCode || 'KG',
      sellingPrice: item.unitPrice,
      stockQuantity: item.maxStock,
    });
  }, []);

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
      const result = applyMarkingScan(payload, product.productMark || product.markCode);
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

  /**
   * Только DataMatrix (КМ). Не смешивается со штрихкодом.
   * Не найден / уже продан → сообщение и стоп. ASL только здесь.
   */
  const tryAddByMarking = useCallback(
    async (rawCode) => {
      if (!rawCode || !storeId || payOpen || returnOpen) return false;
      if (classifyPosScanInput(rawCode) !== 'marking') return false;
      // КМ не должен падать в штрихкод/список, даже если предыдущий скан ещё идёт
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
      if (before.status === 'sold') {
        toast.error(t(aslMarkingEnabled
          ? 'pos.markingAlreadySold'
          : 'pharmacyCashier.integrations.markingSoldLocalNoKey'));
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
          aslEnabled: Boolean(aslMarkingEnabled),
        });
        if (resolved.status === 'sold') {
          toast.error(t(aslMarkingEnabled
            ? 'pos.markingAlreadySold'
            : 'pharmacyCashier.integrations.markingSoldLocalNoKey'));
          setSearch('');
          return true;
        }
        if (resolved.status === 'withdrawn') {
          toast.error(resolved.message || t('pos.markingNotInCirculation'));
          setSearch('');
          return true;
        }
        if (resolved.status === 'check-failed') {
          toast.error(resolved.message || t('pos.markingCheckFailed'));
          setSearch('');
          return true;
        }
        if (resolved.status === 'ok' && resolved.product) {
          addMarkedScanToCart(resolved.product);
          setSearch('');
          return true;
        }
        toast.error(t('pos.markingNotFound'));
        setSearch('');
        return true;
      } catch (e) {
        toast.error(t(e?.code === 'MARK_ALREADY_SOLD'
          ? 'pos.markingAlreadySold'
          : 'pos.markingNotFound'));
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
      aslMarkingEnabled,
      cashRegisterId,
      payOpen,
      products,
      returnOpen,
      searchInputRef,
      setSearch,
      shiftIsOpen,
      storeId,
      t,
    ]
  );

  const addProductToCart = useCallback(
    (product) => {
      if (!shiftIsOpen) {
        toast.error(t('pos.shiftRequired'));
        return;
      }
      if (!product.active) {
        toast.error(t('pos.productInactive'));
        return;
      }
      const saleType = product.saleType || 'PIECE';
      if (saleType !== 'SERVICE' && Number(product.stockQuantity) <= 0) {
        toast.error(t('pos.outOfStock'));
        return;
      }
      const payload = cartProductPayload(product);
      if (isMeasuredProduct(product)) {
        setWeightEditLineId(null);
        setWeightModalProduct(payload);
        return;
      }
      const lineId = addPieceItem(payload, 1);
      const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
      if (line) showLineAddedToast(line, product.name);
      setSelectedLineId(lineId);
    },
    [addPieceItem, cartProductPayload, shiftIsOpen, showLineAddedToast, t, setSelectedLineId]
  );

  const handleWeightConfirm = useCallback(
    (kg, options = {}) => {
      const payload = weightModalProduct;
      if (!payload) return;
      const lineUnitPrice =
        options.unitPrice != null && Number(options.unitPrice) > 0
          ? Number(options.unitPrice)
          : payload.sellingPrice;
      let lineId = weightEditLineId;
      if (weightEditLineId) {
        updateQuantity(weightEditLineId, kg);
        if (options.unitPrice != null) {
          updateUnitPrice(weightEditLineId, lineUnitPrice);
        }
      } else {
        lineId = addWeightLine({ ...payload, sellingPrice: lineUnitPrice }, kg);
        const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
        if (line) showLineAddedToast(line, payload.name);
      }
      setWeightModalProduct(null);
      setWeightEditLineId(null);
      if (lineId) setSelectedLineId(lineId);
    },
    [
      addWeightLine,
      showLineAddedToast,
      updateQuantity,
      updateUnitPrice,
      weightEditLineId,
      weightModalProduct,
      setSelectedLineId,
    ]
  );

  /**
   * Только обычный штрихкод / весовой PLU. ASL не вызывается.
   * Продажа в налог — как раньше.
   */
  const tryAddByBarcode = useCallback(
    async (code, { silent = false } = {}) => {
      const trimmed = code.trim();
      if (!trimmed || !storeId || scanningRef.current || payOpen || returnOpen) return false;

      // Жёсткое разделение: КМ → только маркировка; штрихкод → налог без ASL
      if (classifyPosScanInput(trimmed) === 'marking') {
        await tryAddByMarking(trimmed);
        return true;
      }

      scanningRef.current = true;
      try {
        const decoded = decodeWeightBarcode(trimmed);
        if (decoded) {
          try {
            const { data: product } = await scalesApi.getByPlu(decoded.plu, storeId);
            if (!shiftIsOpen) {
              toast.error(t('pos.shiftRequired'));
              return false;
            }
            if (!product?.active) {
              toast.error(t('pos.productInactive'));
              return false;
            }
            const payload = cartProductPayload(product);
            const lineId = addWeightLine(payload, decoded.weightKg);
            const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
            if (line) showLineAddedToast(line, product.name);
            if (lineId) setSelectedLineId(lineId);
            setSearch('');
            return true;
          } catch {
            // Не весовой товар с похожим на этикетку кодом — ищем как обычный штрихкод
          }
        }

        const digits = trimmed.replace(/\D/g, '');
        const barcodeCandidates = [trimmed];
        if (digits && digits !== trimmed) barcodeCandidates.push(digits);
        // EAN-13 со check digit, в карточке часто лежит 12 цифр без контрольной
        if (digits.length === 13) barcodeCandidates.push(digits.slice(0, 12));

        for (const code of barcodeCandidates) {
          const product = await posFetchProductByBarcode(storeId, code);
          if (product) {
            addProductToCart(withScannedBarcode(product, code));
            setSearch('');
            return true;
          }
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
    ]
  );

  useBarcodeScanner({
    enabled: !!storeId && !payOpen && !shiftModalOpen && !returnOpen,
    barcodeInputRef: searchInputRef,
    onScan: (code) => tryAddByBarcode(code),
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
    const exact =
      (byBarcode && withScannedBarcode(byBarcode, q)) ||
      products.find((p) => p.sku?.toLowerCase() === lower) ||
      products.find((p) => p.name?.toLowerCase() === lower);
    addProductToCart(exact ?? products[0]);
    setSearch('');
  }, [search, products, productsStale, tryAddByBarcode, addProductToCart, t, setSearch]);

  const handleQtyDelta = useCallback(
    (lineId, delta) => {
      const items = useCartStore.getState().items;
      const item = items.find((i) => i.lineId === lineId);
      if (!item) return;
      if (Array.isArray(item.productMarks) && item.productMarks.length > 0) {
        if (delta > 0) {
          toast.error(t('pos.markingQtyViaScan'));
          return;
        }
      }
      if (item.saleType === 'WEIGHT') {
        const unitCode = item.unitCode || 'KG';
        const step = qtyStepForUnit(unitCode);
        const minQty = minQtyForUnit(unitCode);
        const next =
          getUnitConfig(unitCode).scale === 0
            ? Math.max(0, Math.round(item.quantity + delta * step))
            : roundQty(item.quantity + delta * step);
        if (next < minQty) {
          removeItem(lineId);
          if (selectedLineId === lineId) setSelectedLineId(null);
          return;
        }
        updateQuantity(lineId, next);
        return;
      }
      updateQuantity(lineId, item.quantity + delta);
    },
    [removeItem, selectedLineId, setSelectedLineId, updateQuantity, t]
  );

  const closeWeightModal = useCallback(() => {
    setWeightModalProduct(null);
    setWeightEditLineId(null);
  }, []);

  return {
    weightModalProduct,
    weightEditLineId,
    handleWeightConfirm,
    closeWeightModal,
    addProductToCart,
    handleSearchEnter,
    handleQtyDelta,
    openWeightModalForLine,
    tryAddByMarking,
  };
}
