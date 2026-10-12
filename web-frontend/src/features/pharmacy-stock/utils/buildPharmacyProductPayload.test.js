import { describe, expect, it } from 'vitest';
import {
  buildPharmacyProductCreatePayload,
  emptyPharmacyProductForm,
  validatePharmacyProductForm,
} from './buildPharmacyProductPayload';

const t = (key) => key;

describe('buildPharmacyProductPayload', () => {
  it('creates a product from name without invoice', () => {
    const form = {
      ...emptyPharmacyProductForm(),
      name: 'Парацетамол',
    };
    expect(validatePharmacyProductForm(form, t)).toBeNull();
    const payload = buildPharmacyProductCreatePayload(form, { storeId: 5 });
    expect(payload.name).toBe('Парацетамол');
    expect(payload.sellingPrice).toBe(0.01);
    expect(payload.storePrices).toEqual([{ storeId: 5, price: 0.01 }]);
    expect(payload.uzInvoiceDocumentId).toBeUndefined();
    expect(payload.businessTypeCode).toBe('PHARMACY');
  });

  it('requires name only', () => {
    expect(validatePharmacyProductForm(emptyPharmacyProductForm(), t)).toBe('pharmacyStock.productErrName');
    expect(validatePharmacyProductForm({
      ...emptyPharmacyProductForm(),
      name: 'Аспирин',
    }, t)).toBeNull();
  });

  it('does not require manufacturer or form', () => {
    const form = {
      ...emptyPharmacyProductForm(),
      name: 'Анальгин',
      manufacturer: '',
      dosageForm: '',
    };
    expect(validatePharmacyProductForm(form, t)).toBeNull();
  });
});
