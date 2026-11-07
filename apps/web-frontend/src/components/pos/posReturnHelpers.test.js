import { describe, expect, it } from 'vitest';
import { parseLookupError, paymentLabel } from './posReturnHelpers';

describe('posReturnHelpers', () => {
  const t = (key) => key;

  describe('paymentLabel', () => {
    it('returns translation for standard payment types', () => {
      expect(paymentLabel('CASH', t)).toBe('pos.payCash');
      expect(paymentLabel('CARD', t)).toBe('pos.payCard');
      expect(paymentLabel('CASHLESS', t)).toBe('pos.payCashless');
      expect(paymentLabel('MIXED', t)).toBe('pos.payMixed');
      expect(paymentLabel('MPESA', t)).toBe('M-Pesa');
    });

    it('falls back to method or dash when unknown', () => {
      expect(paymentLabel('OTHER', t)).toBe('OTHER');
      expect(paymentLabel(null, t)).toBe('—');
      expect(paymentLabel('', t)).toBe('—');
    });
  });

  describe('parseLookupError', () => {
    it('handles 403 access denied errors', () => {
      const err = { response: { status: 403 } };
      expect(parseLookupError(err, t)).toBe('pos.returnAccessDenied');
    });

    it('handles message containing access denied', () => {
      const err = { response: { data: { message: 'Access denied to store' } } };
      expect(parseLookupError(err, t)).toBe('pos.returnAccessDenied');
    });

    it('handles 404 not found errors', () => {
      const err = { response: { status: 404 } };
      expect(parseLookupError(err, t)).toBe('pos.returnNotFound');
    });

    it('returns response message if available', () => {
      const err = { response: { data: { message: 'Custom server error' } } };
      expect(parseLookupError(err, t)).toBe('Custom server error');
    });

    it('falls back to returnNotFound for empty error', () => {
      expect(parseLookupError({}, t)).toBe('pos.returnNotFound');
    });
  });
});
