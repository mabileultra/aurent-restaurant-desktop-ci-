import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { posFetchProductByBarcode } from '../../../services/pos/posDataRouter';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { lineSubtotal, useCartStore } from '../../../store/cartStore';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import {
  isMeasuredProduct,
  minQtyForUnit,
  qtyStepForUnit,
  roundQty,
} from '../../../utils/quantityFormat';
import { getUnitConfig } from '../../../utils/unitConfig';
import { resolveProductUnitPrice } from '../../../utils/productPrice';
import { addPharmacyPieceItem } from '../utils/pharmacyCartActions';
import { applyPharmacyMarkingScan, isMarkCountedLine } from '../utils/pharmacyMarkedScanCart';
import { applyPharmacyPackSaleToCartProduct } from '../utils/pharmacyPackSale';
import { toCartQuantity } from '../utils/pharmacyPackQty';
import {
  getCachedPharmacyProduct,
  setCachedPharmacyProduct,
} from '../utils/pharmacyBarcodeProductCache';
import {
  productPieceStep,
  productSellByPiece,
  productUnitsInPack,
} from '../utils/pharmacyProductMeta';
import { classifyPharmacySearchScan } from '../utils/classifyPharmacySearchScan';
import { isPharmacyMarkingCode } from '../utils/pharmacyMarkingCode';
import { focusPharmacyScanField, isPharmacyKmFieldFocused } from '../utils/focusPharmacyScanField';

export function usePharmacyCartHandlers({
  storeId,
  shiftIsOpen,
  payOpen,
  returnOpen,
  shiftModalOpen,
  searchInputRef,
  kmInputRef,
  products,
  search,
  setSearch,
  addWeightLine,
  updateQuantity,
  updateUnitPrice,
  removeItem,
  selectedLineId,
  setSelectedLineId,
  onMarkingScan,
}) {
  const { t } = useTranslation();
  const scanningRef = useRef(false);
  const [weightModalProduct, setWeightModalProduct] = useState(null);
  const [weightEditLineId, setWeightEditLineId] = useState(null);
  const [qtyModalProduct, setQtyModalProduct] = useState(null);

  const cartProductPayload = useCallback(
    (product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      ikpu: product.ikpu ?? null,
      barcode: product.barcode ?? null,
      barcodes: product.barcodes ?? product.additionalBarcodes ?? null,
      additionalBarcodes: product.additionalBarcodes ?? null,
      packageCode: product.packageCode ?? null,
      commissionTin: product.commissionTin ?? null,
      markedProduct: product.markedProduct === true || Boolean(product.productMark || product.markCode),
      productMark: product.productMark ?? product.markCode ?? null,
      markCode: product.markCode ?? product.productMark ?? null,
      attributes: product.attributes ?? null,
      saleType: product.saleType || 'PIECE',
      unitCode: product.unitCode,
      unitOfMeasure: product.unitOfMeasure ?? null,
      storageLocation: product.storageLocation ?? null,
      quantityScale: product.quantityScale,
      allowFraction: product.allowFraction,
      soldIndividually: product.soldIndividually === true,
      costPrice: Number(product.costPrice ?? 0),
      sellingPrice: resolveProductUnitPrice(product, storeId),
      defaultDiscountPercent: Number(product.defaultDiscountPercent ?? 0),
      taxRate: Number(product.taxRate ?? 12),
      stockQuantity: Number(product.stockQuantity ?? 0),
      active: product.active !== false,
      manufacturer: product.manufacturer ?? null,
      unitsInPack: productUnitsInPack(product),
      pieceStep: productPieceStep(product),
      lotBatch: product.lotBatch ?? null,
      lotExpiry: product.lotExpiry ?? null,
    }),
    [storeId],
  );

  const showLineAddedToast = useCallback(
    (line, productName, addedSum = null) => {
      const sum = addedSum != null ? Number(addedSum) : lineSubtotal(line);
      toast.success(
        <div className="pos-item-added-toast">
          <p className="pos-item-added-toast__name">{productName}</p>
          <p className="pos-item-added-toast__sum">{fmt(sum)}</p>
        </div>,
        {
          duration: 2600,
          className: 'pos-item-added-toast-host',
          ariaLabel: t('pos.itemAdded', {
            name: productName,
            sum: fmt(sum),
          }),
        },
      );
    },
    [t],
  );

  const guardProduct = useCallback(
    (product) => {
      if (!shiftIsOpen) {
        toast.error(t('pos.shiftRequired'));
        return false;
      }
      if (product.active === false) {
        toast.error(t('pos.productInactive'));
        return false;
      }
      const saleType = product.saleType || 'PIECE';
      if (saleType !== 'SERVICE') {
        const payload = cartProductPayload(product);
        const available = Number(payload.stockQuantity ?? 0);
        if (available <= 0) {
          toast.error(t('pos.outOfStock'));
          return false;
        }
      }
      return true;
    },
    [cartProductPayload, shiftIsOpen, t],
  );

  const addMarkedScan = useCallback(
    (product) => {
      if (!guardProduct(product)) return null;
      const payload = {
        ...cartProductPayload(product),
        pharmacySellByPiece: false,
      };
      const result = applyPharmacyMarkingScan(payload, product.productMark || product.markCode);
      if (result.status === 'duplicate') {
        toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
        return result;
      }
      if (result.status === 'stock') {
        toast.error(t('pos.outOfStock'));
        return result;
      }
      if (result.status !== 'added') return result;
      const line = useCartStore.getState().items.find((item) => item.lineId === result.lineId);
      // Тост = цена одной добавленной пачки, не вся строка (иначе кажется «двойной» счёт).
      if (line) showLineAddedToast(line, product.name, Number(line.unitPrice) || 0);
      setSelectedLineId(result.lineId);
      setSearch('');
      focusPharmacyScanField({ kmInputRef, searchInputRef, preferKm: true });
      return result;
    },
    [cartProductPayload, guardProduct, kmInputRef, searchInputRef, setSearch, setSelectedLineId, showLineAddedToast, t],
  );

  const addProductToCart = useCallback(
    (product) => {
      if (!guardProduct(product)) return;
      const payload = cartProductPayload(product);
      if (isMeasuredProduct(product)) {
        setWeightEditLineId(null);
        setWeightModalProduct(payload);
        return;
      }
      setQtyModalProduct(payload);
    },
    [cartProductPayload, guardProduct],
  );

  const handleQtyConfirm = useCallback(
    ({ packs = 0, pieces = 0, lot, productMarks } = {}) => {
      const product = qtyModalProduct;
      if (!product) return;
      const unitsInPack = productUnitsInPack(product) || Number(product.unitsInPack) || 1;
      const marks = Array.isArray(productMarks) ? productMarks.filter(Boolean) : [];
      const sellByPiece = marks.length > 0 ? false : productSellByPiece(product);
      const qty = marks.length > 0
        ? marks.length
        : toCartQuantity({ packs, pieces, unitsInPack, sellByPiece });
      if (qty <= 0) return;
      let payload = {
        ...product,
        pieceStep: productPieceStep(product),
        attributes: {
          ...(product.attributes || {}),
          ...(lot?.batchNumber ? { batch: lot.batchNumber, lotBatch: lot.batchNumber } : {}),
          ...(lot?.expiryDate ? { expiry_date: lot.expiryDate, lotExpiry: lot.expiryDate } : {}),
        },
      };
      if (sellByPiece && unitsInPack > 1) {
        payload = applyPharmacyPackSaleToCartProduct(payload);
      } else {
        payload = { ...payload, pharmacySellByPiece: false };
      }
      if (marks.length > 0) {
        payload = {
          ...payload,
          markedProduct: true,
          productMark: marks[0],
          markCode: marks[0],
          productMarks: marks,
          pharmacySellByPiece: false,
          packUnitPrice: null,
        };
      }
      const lineId = marks.length > 0
        ? useCartStore.getState().insertSeparatePieceItem(payload, qty)
        : addPharmacyPieceItem(payload, qty);
      const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
      if (line) showLineAddedToast(line, product.name);
      setQtyModalProduct(null);
      setSelectedLineId(lineId);
      setSearch('');
      focusPharmacyScanField({ kmInputRef, searchInputRef });
    },
    [qtyModalProduct, kmInputRef, searchInputRef, setSearch, setSelectedLineId, showLineAddedToast],
  );

  const closeQtyModal = useCallback(() => {
    setQtyModalProduct(null);
    focusPharmacyScanField({ kmInputRef, searchInputRef });
  }, [kmInputRef, searchInputRef]);

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
      setSearch('');
      focusPharmacyScanField({ kmInputRef, searchInputRef });
    },
    [
      addWeightLine,
      kmInputRef,
      searchInputRef,
      setSearch,
      setSelectedLineId,
      showLineAddedToast,
      updateQuantity,
      updateUnitPrice,
      weightEditLineId,
      weightModalProduct,
    ],
  );

  const closeWeightModal = useCallback(() => {
    setWeightModalProduct(null);
    setWeightEditLineId(null);
    focusPharmacyScanField({ kmInputRef, searchInputRef });
  }, [kmInputRef, searchInputRef]);

  const tryAddByBarcode = useCallback(
    async (code, { silent = false } = {}) => {
      const trimmed = code.trim();
      if (!trimmed || !storeId || payOpen || returnOpen) {
        return false;
      }

      // КМ — в очередь, даже если открыта модалка количества (её закрываем).
      if (onMarkingScan && isPharmacyMarkingCode(trimmed)) {
        if (qtyModalProduct) setQtyModalProduct(null);
        const keepKm = isPharmacyKmFieldFocused(kmInputRef);
        const markingHandled = onMarkingScan(trimmed, { silent });
        if (markingHandled) {
          setSearch('');
          focusPharmacyScanField({
            kmInputRef,
            searchInputRef,
            preferKm: keepKm,
          });
          return true;
        }
      }

      if (scanningRef.current || qtyModalProduct) {
        return false;
      }
      scanningRef.current = true;
      try {
        const cached = getCachedPharmacyProduct(storeId, trimmed);
        if (cached) {
          addProductToCart(cached);
          setSearch('');
          return true;
        }
        const product = await posFetchProductByBarcode(storeId, trimmed, { catalogKind: 'pharmacy' });
        if (product) {
          setCachedPharmacyProduct(storeId, trimmed, product);
          addProductToCart(product);
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
        focusPharmacyScanField({ kmInputRef, searchInputRef });
      }
    },
    [
      storeId,
      addProductToCart,
      payOpen,
      returnOpen,
      qtyModalProduct,
      onMarkingScan,
      t,
      setSearch,
      searchInputRef,
      kmInputRef,
    ],
  );

  useBarcodeScanner({
    enabled:
      !!storeId
      && !payOpen
      && !shiftModalOpen
      && !returnOpen
      && !qtyModalProduct
      && !weightModalProduct,
    barcodeInputRef: searchInputRef,
    passthroughInputRefs: kmInputRef ? [kmInputRef] : [],
    onScan: (code) => tryAddByBarcode(code),
    alwaysCapture: true,
  });

  const handleSearchEnter = useCallback(async () => {
    const q = search.trim();
    if (!q) return;
    const { kind } = classifyPharmacySearchScan(q);
    // Одно поле: КМ → сразу в чек; штрихкод → товар; текст → поиск по имени.
    if (kind === 'marking') {
      await tryAddByBarcode(q, { silent: false });
      return;
    }
    if (await tryAddByBarcode(q, { silent: kind === 'text' })) return;
    if (products.length === 0) {
      toast.error(t('pos.barcodeNotFound'));
      return;
    }
    const lower = q.toLowerCase();
    const exact =
      products.find((p) => p.barcode?.toLowerCase() === lower)
      || products.find((p) => p.sku?.toLowerCase() === lower)
      || products.find((p) => p.name?.toLowerCase() === lower)
      || products.find((p) => String(p.name || '').toLowerCase().includes(lower));
    if (!exact) {
      toast.error(t('pos.barcodeNotFound'));
      return;
    }
    addProductToCart(exact);
  }, [search, products, tryAddByBarcode, addProductToCart, t]);

  const handleQtyDelta = useCallback(
    (lineId, delta) => {
      const items = useCartStore.getState().items;
      const item = items.find((i) => i.lineId === lineId);
      if (!item) return;
      if (isMarkCountedLine(item)) return;
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
      const step = item.pharmacySellByPiece
        ? Math.max(1, Number(item.pieceStep) || 1)
        : 1;
      const next = item.quantity + delta * step;
      if (item.maxStock > 0 && next > item.maxStock) {
        toast.error(t('pharmacyCashier.qtyExceedsStock'));
        return;
      }
      if (next <= 0) {
        removeItem(lineId);
        if (selectedLineId === lineId) setSelectedLineId(null);
        return;
      }
      updateQuantity(lineId, next);
    },
    [removeItem, selectedLineId, setSelectedLineId, t, updateQuantity],
  );

  return {
    weightModalProduct,
    handleWeightConfirm,
    closeWeightModal,
    qtyModalProduct,
    handleQtyConfirm,
    closeQtyModal,
    addProductToCart,
    addMarkedScan,
    handleSearchEnter,
    handleQtyDelta,
  };
}
