import { describe, expect, it } from 'vitest';
import {
  PRESCRIPTION_NUMBER_MAX_LENGTH,
  PRESCRIPTION_NUMBER_REQUIRED_CODE,
  assertCartPrescriptionReady,
  assertSalePrescriptionNumber,
  cartHasPrescriptionRequiredItems,
  cartPrescriptionLines,
  isPrescriptionExemptPayment,
  isValidPrescriptionNumber,
  lineRequiresPrescription,
  normalizePrescriptionNumber,
  resolveCartPrescriptionNumber,
  resolveSalePrescriptionNumber,
  validatePrescriptionNumber,
  withSalePrescriptionNumber,
} from './prescriptionNumber.js';

const PLAIN_LINE = { productId: 1, name: 'Vitamin C' };
const RX_LINE = { productId: 2, name: 'Amoksitsillin', requiresPrescription: true };
const VALID_NUMBER = 'RX-2026/0042';

describe('prescription number format', () => {
  it('trims and accepts 4–64 letters, digits, "-" and "/"', () => {
    expect(normalizePrescriptionNumber('  RX-1234  ')).toBe('RX-1234');
    expect(validatePrescriptionNumber('  RX-1234  ')).toEqual({ ok: true, value: 'RX-1234' });
    expect(isValidPrescriptionNumber('1234')).toBe(true);
    expect(isValidPrescriptionNumber(VALID_NUMBER)).toBe(true);
    expect(isValidPrescriptionNumber('РЦ-12/аб')).toBe(true);
    expect(isValidPrescriptionNumber('9'.repeat(PRESCRIPTION_NUMBER_MAX_LENGTH))).toBe(true);
  });

  it('rejects empty, too short, too long and forbidden characters', () => {
    expect(validatePrescriptionNumber('')).toEqual({ ok: false, issue: 'missing' });
    expect(validatePrescriptionNumber('   ')).toEqual({ ok: false, issue: 'missing' });
    expect(validatePrescriptionNumber(null)).toEqual({ ok: false, issue: 'missing' });
    expect(validatePrescriptionNumber('123')).toEqual({ ok: false, issue: 'invalid' });
    expect(validatePrescriptionNumber('9'.repeat(PRESCRIPTION_NUMBER_MAX_LENGTH + 1)))
      .toEqual({ ok: false, issue: 'invalid' });
    expect(isValidPrescriptionNumber('RX 1234')).toBe(false);
    expect(isValidPrescriptionNumber('RX_1234')).toBe(false);
    expect(isValidPrescriptionNumber('RX|1234')).toBe(false);
    expect(isValidPrescriptionNumber('RX.1234')).toBe(false);
  });
});

describe('prescription lines', () => {
  it('lineRequiresPrescription: line flag, attributes, retailExtras', () => {
    expect(lineRequiresPrescription(RX_LINE)).toBe(true);
    expect(lineRequiresPrescription({ attributes: { prescription_required: 'true' } })).toBe(true);
    expect(lineRequiresPrescription({ attributes: { 'рецепт': 'Да' } })).toBe(true);
    expect(lineRequiresPrescription({ retailExtras: { pharmacyPrescriptionRequired: true } })).toBe(true);
    expect(lineRequiresPrescription({ prescriptionRequired: 1 })).toBe(true);
    expect(lineRequiresPrescription({ attributes: { prescription_required: 'false' } })).toBe(false);
    expect(lineRequiresPrescription({ requiresPrescription: false })).toBe(false);
    expect(lineRequiresPrescription(PLAIN_LINE)).toBe(false);
    expect(lineRequiresPrescription(null)).toBe(false);
  });

  it('cart helpers', () => {
    expect(cartPrescriptionLines([PLAIN_LINE, RX_LINE])).toEqual([RX_LINE]);
    expect(cartHasPrescriptionRequiredItems([PLAIN_LINE])).toBe(false);
    expect(cartHasPrescriptionRequiredItems([PLAIN_LINE, RX_LINE])).toBe(true);
    expect(cartHasPrescriptionRequiredItems(undefined)).toBe(false);
  });

  it('assertCartPrescriptionReady blocks a prescription cart without a valid number', () => {
    expect(assertCartPrescriptionReady([PLAIN_LINE], '')).toEqual({ ok: true });
    expect(assertCartPrescriptionReady([PLAIN_LINE, RX_LINE], ''))
      .toEqual({ ok: false, issue: 'missing', count: 1 });
    expect(assertCartPrescriptionReady([RX_LINE, RX_LINE], 'ab'))
      .toEqual({ ok: false, issue: 'invalid', count: 2 });
    expect(assertCartPrescriptionReady([PLAIN_LINE, RX_LINE], VALID_NUMBER)).toEqual({ ok: true });
  });

  it('resolveCartPrescriptionNumber: only for carts with prescription lines', () => {
    expect(resolveCartPrescriptionNumber([RX_LINE], ` ${VALID_NUMBER} `)).toBe(VALID_NUMBER);
    expect(resolveCartPrescriptionNumber([PLAIN_LINE], VALID_NUMBER)).toBeNull();
    expect(resolveCartPrescriptionNumber([RX_LINE], '')).toBeNull();
  });
});

describe('assertSalePrescriptionNumber: every payment path', () => {
  const blockedPayments = [
    ['cash', { paymentMethod: 'CASH', receiptType: 'SALE' }],
    ['card', { paymentMethod: 'CARD', receiptType: 'SALE', cardType: 'HUMO' }],
    ['mixed', { paymentMethod: 'MIXED', receiptType: 'SALE', cashAmount: 1000, cardAmount: 2000 }],
    ['cashless', { paymentMethod: 'CASHLESS', receiptType: 'SALE' }],
    ['credit (nasiya)', { paymentMethod: 'CASH', receiptType: 'CREDIT', customerId: 7 }],
    ['advance', { paymentMethod: 'CASH', receiptType: 'ADVANCE', customerId: 7 }],
  ];

  it.each(blockedPayments)('blocks %s sale of a prescription drug without a number', (_label, payment) => {
    let thrown = null;
    try {
      assertSalePrescriptionNumber([PLAIN_LINE, RX_LINE], payment);
    } catch (error) {
      thrown = error;
    }
    expect(thrown?.code).toBe(PRESCRIPTION_NUMBER_REQUIRED_CODE);
  });

  it.each(blockedPayments)('lets %s sale through with a valid number', (_label, payment) => {
    expect(() =>
      assertSalePrescriptionNumber([RX_LINE], { ...payment, prescriptionNumber: VALID_NUMBER }),
    ).not.toThrow();
  });

  it('blocks an invalid number', () => {
    expect(() =>
      assertSalePrescriptionNumber([RX_LINE], { receiptType: 'SALE', prescriptionNumber: 'a b' }),
    ).toThrow(PRESCRIPTION_NUMBER_REQUIRED_CODE);
  });

  it('does not ask for a prescription on refund', () => {
    expect(isPrescriptionExemptPayment({ receiptType: 'RETURN' })).toBe(true);
    expect(isPrescriptionExemptPayment({ receiptType: 'refund' })).toBe(true);
    expect(isPrescriptionExemptPayment({ receiptType: 'SALE' })).toBe(false);
    expect(() => assertSalePrescriptionNumber([RX_LINE], { receiptType: 'RETURN' })).not.toThrow();
  });

  it('does not touch carts without prescription drugs', () => {
    expect(() => assertSalePrescriptionNumber([PLAIN_LINE], { receiptType: 'SALE' })).not.toThrow();
  });
});

describe('sale receipt number', () => {
  it('withSalePrescriptionNumber attaches the payment number to the sale response', () => {
    expect(withSalePrescriptionNumber({ id: 1 }, { prescriptionNumber: VALID_NUMBER }))
      .toEqual({ id: 1, prescriptionNumber: VALID_NUMBER });
    const plainSale = { id: 2 };
    expect(withSalePrescriptionNumber(plainSale, { paymentMethod: 'CASH' })).toBe(plainSale);
    expect(withSalePrescriptionNumber(null, { prescriptionNumber: VALID_NUMBER })).toBeNull();
  });

  it('resolveSalePrescriptionNumber reads only the attached field, never notes', () => {
    expect(resolveSalePrescriptionNumber({ prescriptionNumber: VALID_NUMBER })).toBe(VALID_NUMBER);
    expect(resolveSalePrescriptionNumber({ notes: `RX:${VALID_NUMBER}` })).toBeNull();
    expect(resolveSalePrescriptionNumber({})).toBeNull();
    expect(resolveSalePrescriptionNumber(null)).toBeNull();
  });
});
