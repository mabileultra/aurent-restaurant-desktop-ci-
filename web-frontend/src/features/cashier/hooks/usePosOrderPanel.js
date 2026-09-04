import { useEffect, useRef, useState } from 'react';
import { lineSubtotal, useCartStore } from '../../../store/cartStore';
import { round2 } from '../../../utils/taxAmounts';
import {
  parseQtyInput,
  qtyToEditString,
} from '../../../utils/quantityFormat';

export function usePosOrderPanel({
  items,
  selectedLineId,
  onUpdateQuantity,
  onUpdatePrice,
  total,
  taxTotal: taxTotalOverride,
}) {
  const getTaxTotal = useCartStore((s) => s.getTaxTotal);
  const taxTotal = taxTotalOverride ?? getTaxTotal();
  const linesTotal = items.reduce((s, i) => s + lineSubtotal(i), 0);
  const payableTotal = total ?? linesTotal;
  const subtotalBeforeTax = Math.max(0, payableTotal - taxTotal);
  const taxRateLabel =
    items.length === 0 ? 0 : Math.round(items.reduce((s, i) => s + (i.taxRate ?? 0), 0) / items.length);
  const positionsCount = items.length;
  const totalQtyRaw = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const totalQty =
    Math.abs(totalQtyRaw - Math.round(totalQtyRaw)) < 1e-9
      ? Math.round(totalQtyRaw)
      : round2(totalQtyRaw);

  const rowRefs = useRef({});
  const [editingPriceLineId, setEditingPriceLineId] = useState(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [editingQtyLineId, setEditingQtyLineId] = useState(null);
  const [qtyDraft, setQtyDraft] = useState('');

  useEffect(() => {
    if (!selectedLineId) return;
    rowRefs.current[selectedLineId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedLineId, items]);

  const commitPrice = (lineId) => {
    const num = Number(String(priceDraft).replace(',', '.'));
    if (!Number.isNaN(num)) onUpdatePrice(lineId, num);
    setEditingPriceLineId(null);
  };

  const startQtyEdit = (item) => {
    setEditingQtyLineId(item.lineId);
    setQtyDraft(qtyToEditString(item.quantity, item.saleType, item.unitCode));
  };

  const commitQty = (item) => {
    const parsed = parseQtyInput(qtyDraft, item.saleType, item.unitCode);
    if (parsed != null) onUpdateQuantity(item.lineId, parsed);
    setEditingQtyLineId(null);
  };

  return {
    taxTotal,
    payableTotal,
    subtotalBeforeTax,
    taxRateLabel,
    positionsCount,
    totalQty,
    rowRefs,
    editingPriceLineId,
    setEditingPriceLineId,
    priceDraft,
    setPriceDraft,
    editingQtyLineId,
    setEditingQtyLineId,
    qtyDraft,
    setQtyDraft,
    commitPrice,
    startQtyEdit,
    commitQty,
  };
}
