import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { round2 } from '../../../utils/taxAmounts';
import { measuredLineFromAmount, minQtyForUnit, roundQty } from '../../../utils/quantityFormat';
import { getUnitConfig } from '../../../utils/unitConfig';
import { displayQtyValue, parseDecimalInput } from '../../cashier/utils/weightEntryUtils';

/**
 * Measured qty keypad for pharmacy — same UI contract as grocery WeightEntryModalBody,
 * without desktop scale bridge / PLU.
 */
export function usePharmacyWeightEntryModal({ open, product, unitPrice, maxStock, onConfirm, onClose }) {
  const { t } = useTranslation();
  const unitCode = product?.unitCode || 'KG';
  const unitConfig = getUnitConfig(unitCode);
  const minQty = minQtyForUnit(unitCode);
  const [mode, setMode] = useState('qty');
  const [qtyDraft, setQtyDraft] = useState('');
  const [amountDraft, setAmountDraft] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode('qty');
    setQtyDraft('');
    setAmountDraft('');
  }, [open, product?.id]);

  const price = Number(unitPrice) || 0;
  const stock = Number(maxStock) || 0;
  const parsedAmount = parseDecimalInput(amountDraft);
  const unit = unitConfig.label;

  const amountLine = useMemo(() => {
    if (mode !== 'amount' || parsedAmount == null || parsedAmount <= 0) return null;
    return measuredLineFromAmount(parsedAmount, price, unitCode);
  }, [mode, parsedAmount, price, unitCode]);

  const enteredQty = useMemo(() => {
    if (mode === 'amount') return amountLine?.qty ?? 0;
    if (mode === 'qty') {
      const w = parseDecimalInput(qtyDraft);
      if (w == null) return 0;
      return unitConfig.scale === 0 ? Math.max(minQty, Math.round(w)) : roundQty(w);
    }
    return 0;
  }, [mode, amountLine, qtyDraft, unitConfig.scale, minQty]);

  const lineSum = useMemo(() => {
    if (mode === 'amount') return amountLine?.lineSum ?? 0;
    return round2(enteredQty * price);
  }, [mode, amountLine, enteredQty, price]);

  const confirmUnitPrice = mode === 'amount' ? amountLine?.unitPrice ?? price : price;

  const canConfirm =
    enteredQty >= minQty
    && lineSum > 0
    && (stock <= 0 || enteredQty <= stock + 0.0005)
    && price > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const qty = unitConfig.scale === 0 ? Math.round(enteredQty) : roundQty(enteredQty);
    onConfirm(qty, { unitPrice: confirmUnitPrice });
  };

  return {
    t,
    open,
    product,
    onClose,
    unit,
    unitCode,
    unitConfig,
    minQty,
    mode,
    setMode,
    qtyDraft,
    setQtyDraft,
    amountDraft,
    setAmountDraft,
    showScaleTab: false,
    scale: { reading: null, reconnect: () => {}, applyToDraft: () => null },
    price,
    stock,
    enteredQty,
    lineSum,
    canConfirm,
    handleConfirm,
    handleOpenScaleSetup: async () => {},
    handleTakeFromScale: () => {},
    displayQtyValue,
  };
}
