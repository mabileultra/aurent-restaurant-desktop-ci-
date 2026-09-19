import { describe, expect, it } from 'vitest';
import {
  buildPharmacyProductCreatePayload,
  emptyPharmacyProductForm,
  validatePharmacyProductForm,
} from './buildPharmacyProductPayload';

const t = (key) => key;

describe('buildPharmacyProductPayload', () => {
  it('creates a product from name and price without invoice', () => {
    const form = {
      ...emptyPharmacyProductForm(),
      name: 'Парацетамол',
      sellingPrice: '12500',
      costPrice: '10000',
      taxRate: '12',
    };
    expect(validatePharmacyProductForm(form, t)).toBeNull();
    const payload = buildPharmacyProductCreatePayload(form);
    expect(payload.name).toBe('Парацетамол');
    expect(payload.sellingPrice).toBe(12500);
    expect(payload.costPrice).toBe(10000);
    expect(payload.taxRate).toBe(12);
    expect(payload.uzInvoiceDocumentId).toBeUndefined();
    expect(payload.businessTypeCode).toBe('PHARMACY');
  });

  it('requires name and retail price', () => {
    expect(validatePharmacyProductForm(emptyPharmacyProductForm(), t)).toBe('pharmacyStock.productErrName');
    expect(validatePharmacyProductForm({
      ...emptyPharmacyProductForm(),
      name: 'Аспирин',
    }, t)).toBe('pharmacyStock.productErrPrice');
    expect(validatePharmacyProductForm({
      ...emptyPharmacyProductForm(),
      name: 'Аспирин',
      sellingPrice: '10',
    }, t)).toBeNull();
  });

  it('does not require manufacturer or form', () => {
    const form = {
      ...emptyPharmacyProductForm(),
      name: 'Анальгин',
      sellingPrice: '8.50',
      manufacturer: '',
      dosageForm: '',
    };
    expect(validatePharmacyProductForm(form, t)).toBeNull();
  });
});
