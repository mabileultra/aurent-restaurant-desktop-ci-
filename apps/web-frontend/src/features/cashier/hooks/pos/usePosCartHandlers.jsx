import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { createPosScanQueue } from '../../utils/posScanQueue';
import { lineSubtotal, useCartStore } from '../../../../store/cartStore';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { isMeasuredProduct } from '../../../../utils/quantityFormat';
import { resolveProductUnitPrice } from '../../../../utils/productPrice';
import { isMarkingOnlyProduct } from '../../../marking';
import { usePosWeightLineModal } from './usePosWeightLineModal';
import { usePosMarkingScan } from './usePosMarkingScan';
import { usePosBarcodeScannerHandler } from './usePosBarcodeScannerHandler';

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
  cashRegisterId = null,
}) {
  const { t } = useTranslation();
  const scanningRef = useRef(false);
  const scanQueueRef = useRef(null);
  if (!scanQueueRef.current) scanQueueRef.current = createPosScanQueue({ maxPending: 24 });

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
      commissionPinfl: product.commissionPinfl ?? null,
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
      // Block KM: resolveCashierMarking sets these; without them qty stays 1.
      sellAsBlock: product.sellAsBlock === true,
      unitsInPack: product.unitsInPack ?? null,
      packageName: product.packageName ?? null,
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

  const weight = usePosWeightLineModal({
    addWeightLine,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    selectedLineId,
    setSelectedLineId,
    showLineAddedToast,
    t,
  });

  const marking = usePosMarkingScan({
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
  });

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
      if (isMarkingOnlyProduct(product) && !(product.productMark || product.markCode)) {
        toast.error(t('pos.markingScanRequired'));
        return;
      }
      const saleType = product.saleType || 'PIECE';
      if (saleType !== 'SERVICE' && Number(product.stockQuantity) <= 0) {
        toast.error(t('pos.outOfStock'));
        return;
      }
      const payload = cartProductPayload(product);
      if (isMeasuredProduct(product)) {
        weight.setWeightEditLineId(null);
        weight.setWeightModalProduct(payload);
        return;
      }
      const lineId = addPieceItem(payload, 1);
      const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
      if (line) showLineAddedToast(line, product.name);
      setSelectedLineId(lineId);
    },
    [addPieceItem, cartProductPayload, shiftIsOpen, showLineAddedToast, t, setSelectedLineId, weight]
  );

  const scanner = usePosBarcodeScannerHandler({
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
    tryAddByMarking: marking.tryAddByMarking,
    t,
  });

  return {
    weightModalProduct: weight.weightModalProduct,
    weightEditLineId: weight.weightEditLineId,
    handleWeightConfirm: weight.handleWeightConfirm,
    closeWeightModal: weight.closeWeightModal,
    addProductToCart,
    handleSearchEnter: scanner.handleSearchEnter,
    handleQtyDelta: weight.handleQtyDelta,
    openWeightModalForLine: weight.openWeightModalForLine,
    tryAddByMarking: marking.tryAddByMarking,
  };
}
