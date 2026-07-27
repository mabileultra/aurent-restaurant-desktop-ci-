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

export function usePharmacyCartHandlers({
  storeId,
  shiftIsOpen,
  payOpen,
  returnOpen,
  shiftModalOpen,
  searchInputRef,
  products,
  search,
  setSearch,
  addPieceItem,
  addWeightLine,
  updateQuantity,
  updateUnitPrice,
  removeItem,
  selectedLineId,
  setSelectedLineId,
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
      active: product.active !== false,
    }),
    [storeId],
  );

  const showLineAddedToast = useCallback(
    (line, productName) => {
      toast.success(
        <div className="pos-item-added-toast">
          <p className="pos-item-added-toast__name">{productName}</p>
          <p className="pos-item-added-toast__sum">{fmt(lineSubtotal(line))}</p>
        </div>,
        {
          duration: 2600,
          className: 'pos-item-added-toast-host',
          ariaLabel: t('pos.itemAdded', {
            name: productName,
            sum: fmt(lineSubtotal(line)),
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
      if (saleType !== 'SERVICE' && Number(product.stockQuantity) <= 0) {
        toast.error(t('pos.outOfStock'));
        return false;
      }
      return true;
    },
    [shiftIsOpen, t],
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
    (quantity) => {
      const payload = qtyModalProduct;
      if (!payload) return;
      const qty = roundQty(quantity);
      if (qty <= 0) return;
      const lineId = addPieceItem(payload, qty);
      const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
      if (line) showLineAddedToast(line, payload.name);
      setQtyModalProduct(null);
      setSelectedLineId(lineId);
      setSearch('');
      searchInputRef.current?.focus();
    },
    [addPieceItem, qtyModalProduct, searchInputRef, setSearch, setSelectedLineId, showLineAddedToast],
  );

  const closeQtyModal = useCallback(() => {
    setQtyModalProduct(null);
    searchInputRef.current?.focus();
  }, [searchInputRef]);

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
      searchInputRef.current?.focus();
    },
    [
      addWeightLine,
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
    searchInputRef.current?.focus();
  }, [searchInputRef]);

  const tryAddByBarcode = useCallback(
    async (code, { silent = false } = {}) => {
      const trimmed = code.trim();
      if (!trimmed || !storeId || scanningRef.current || payOpen || returnOpen || qtyModalProduct) {
        return false;
      }
      scanningRef.current = true;
      try {
        const product = await posFetchProductByBarcode(storeId, trimmed);
        if (product) {
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
        searchInputRef.current?.focus();
      }
    },
    [
      storeId,
      addProductToCart,
      payOpen,
      returnOpen,
      qtyModalProduct,
      t,
      setSearch,
      searchInputRef,
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
    onScan: (code) => tryAddByBarcode(code),
    alwaysCapture: true,
  });

  const handleSearchEnter = useCallback(async () => {
    const q = search.trim();
    if (!q) return;
    if (await tryAddByBarcode(q, { silent: true })) return;
    if (products.length === 0) {
      toast.error(t('pos.barcodeNotFound'));
      return;
    }
    const lower = q.toLowerCase();
    const exact =
      products.find((p) => p.barcode?.toLowerCase() === lower)
      || products.find((p) => p.sku?.toLowerCase() === lower)
      || products.find((p) => p.name?.toLowerCase() === lower);
    addProductToCart(exact ?? products[0]);
  }, [search, products, tryAddByBarcode, addProductToCart, t]);

  const handleQtyDelta = useCallback(
    (lineId, delta) => {
      const items = useCartStore.getState().items;
      const item = items.find((i) => i.lineId === lineId);
      if (!item) return;
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
      const next = item.quantity + delta;
      if (next <= 0) {
        removeItem(lineId);
        if (selectedLineId === lineId) setSelectedLineId(null);
        return;
      }
      updateQuantity(lineId, next);
    },
    [removeItem, selectedLineId, setSelectedLineId, updateQuantity],
  );

  return {
    weightModalProduct,
    handleWeightConfirm,
    closeWeightModal,
    qtyModalProduct,
    handleQtyConfirm,
    closeQtyModal,
    addProductToCart,
    handleSearchEnter,
    handleQtyDelta,
  };
}
