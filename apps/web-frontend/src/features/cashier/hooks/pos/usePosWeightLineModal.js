import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../../../store/cartStore';
import { getUnitConfig } from '../../../../utils/unitConfig';
import { minQtyForUnit, qtyStepForUnit, roundQty } from '../../../../utils/quantityFormat';
import { resolveForbiddenMxikError } from '../../utils/resolveForbiddenMxikError';

export function usePosWeightLineModal({
  addWeightLine,
  updateQuantity,
  updateUnitPrice,
  removeItem,
  selectedLineId,
  setSelectedLineId,
  showLineAddedToast,
  t,
}) {
  const [weightModalProduct, setWeightModalProduct] = useState(null);
  const [weightEditLineId, setWeightEditLineId] = useState(null);

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
        try {
          lineId = addWeightLine({ ...payload, sellingPrice: lineUnitPrice }, kg);
        } catch (err) {
          const msg = resolveForbiddenMxikError(err, t);
          toast.error(msg || err?.message || t('pos.saleFailed'));
          return;
        }
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
      t,
      updateQuantity,
      updateUnitPrice,
      weightEditLineId,
      weightModalProduct,
      setSelectedLineId,
    ]
  );

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
    setWeightModalProduct,
    weightEditLineId,
    setWeightEditLineId,
    openWeightModalForLine,
    handleWeightConfirm,
    handleQtyDelta,
    closeWeightModal,
  };
}
