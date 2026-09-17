import { useEffect, useState } from 'react';
import {
  calcMarkupFromRetail,
  calcPurchaseWithVat,
  calcRetailFromMarkup,
  calcRetailFromUnit,
  calcUnitRetail,
  emptyLineForm,
  lineToForm,
  toLinePayload,
  validateLineForm,
} from '../utils/pharmacyReceiptPricing';
import {
  formatIsoToDisplay,
  parseSmartExpiryInput,
} from '../utils/smartExpiryInput';

export function usePharmacyReceiptLineForm({
  open,
  product,
  existingLine = null,
  defaultMarkup,
}) {
  const [form, setForm] = useState(() => emptyLineForm(null, defaultMarkup));
  const [docMarkup, setDocMarkup] = useState(String(defaultMarkup ?? 20));
  const [docRetail, setDocRetail] = useState('');

  useEffect(() => {
    if (!open) return;
    const docMk = String(defaultMarkup ?? 20);
    setDocMarkup(docMk);
    if (existingLine) {
      const next = lineToForm(existingLine, defaultMarkup);
      if (next.expiryDate) {
        next.expiryInput = formatIsoToDisplay(next.expiryDate);
      }
      setForm(next);
      const base = next.purchasePriceWithVat
        || calcPurchaseWithVat(next.purchasePrice, next.vatPercent);
      setDocRetail(String(calcRetailFromMarkup(base, docMk)));
      return;
    }
    const next = emptyLineForm(product, defaultMarkup);
    if (next.purchasePrice) {
      next.purchasePriceWithVat = String(
        calcPurchaseWithVat(next.purchasePrice, next.vatPercent),
      );
      next.retailPrice = String(
        calcRetailFromMarkup(next.purchasePriceWithVat, next.markupPercent),
      );
      next.unitRetailPrice = String(
        calcUnitRetail(next.retailPrice, next.unitsInPack),
      );
      setDocRetail(String(calcRetailFromMarkup(next.purchasePriceWithVat, docMk)));
    } else {
      setDocRetail('');
    }
    setForm(next);
  }, [open, product, existingLine, defaultMarkup]);

  const patch = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      const purchase = Number(next.purchasePrice) || 0;
      const vat = Number(next.vatPercent) || 0;

      if (key === 'purchasePrice' || key === 'vatPercent') {
        next.purchasePriceWithVat = String(calcPurchaseWithVat(purchase, vat));
        next.retailPrice = String(
          calcRetailFromMarkup(next.purchasePriceWithVat, next.markupPercent),
        );
        next.unitRetailPrice = String(
          calcUnitRetail(next.retailPrice, next.unitsInPack),
        );
        setDocRetail(String(calcRetailFromMarkup(next.purchasePriceWithVat, docMarkup)));
      }
      if (key === 'purchasePriceWithVat') {
        next.retailPrice = String(
          calcRetailFromMarkup(value, next.markupPercent),
        );
        next.unitRetailPrice = String(
          calcUnitRetail(next.retailPrice, next.unitsInPack),
        );
        setDocRetail(String(calcRetailFromMarkup(value, docMarkup)));
      }
      if (key === 'markupPercent') {
        next.retailPrice = String(
          calcRetailFromMarkup(
            next.purchasePriceWithVat || calcPurchaseWithVat(purchase, vat),
            value,
          ),
        );
        next.unitRetailPrice = String(
          calcUnitRetail(next.retailPrice, next.unitsInPack),
        );
      }
      if (key === 'retailPrice') {
        next.markupPercent = String(
          calcMarkupFromRetail(
            next.purchasePriceWithVat || calcPurchaseWithVat(purchase, vat),
            value,
          ),
        );
        next.unitRetailPrice = String(
          calcUnitRetail(value, next.unitsInPack),
        );
      }
      if (key === 'unitsInPack') {
        next.unitRetailPrice = String(
          calcUnitRetail(next.retailPrice, value),
        );
      }
      if (key === 'unitRetailPrice') {
        const base = next.purchasePriceWithVat || calcPurchaseWithVat(purchase, vat);
        next.retailPrice = String(calcRetailFromUnit(value, next.unitsInPack));
        next.markupPercent = String(calcMarkupFromRetail(base, next.retailPrice));
      }
      if (key === 'expiryInput') {
        const parsed = parseSmartExpiryInput(value);
        next.expiryDate = parsed || '';
      }
      return next;
    });
  };

  const applyDocMarkup = (v) => {
    setDocMarkup(v);
    const base = form.purchasePriceWithVat
      || calcPurchaseWithVat(form.purchasePrice, form.vatPercent);
    const retail = String(calcRetailFromMarkup(base, v));
    setDocRetail(retail);
    patch('markupPercent', v);
  };

  const syncUnitsInPack = (value) => {
    if (String(form.unitsInPack) === String(value)) return;
    patch('unitsInPack', value);
  };

  const buildPayload = (t) => {
    const err = validateLineForm(form, t);
    if (err) return { error: err };
    let expiryDate = form.expiryDate;
    if (!expiryDate && String(form.expiryInput || '').trim()) {
      const parsed = parseSmartExpiryInput(form.expiryInput);
      if (!parsed) return { error: t('pharmacyStock.errExpiry') };
      expiryDate = parsed;
    }
    return { payload: toLinePayload({ ...form, expiryDate: expiryDate || null }) };
  };

  return {
    form,
    setForm,
    patch,
    docMarkup,
    docRetail,
    applyDocMarkup,
    syncUnitsInPack,
    buildPayload,
  };
}
