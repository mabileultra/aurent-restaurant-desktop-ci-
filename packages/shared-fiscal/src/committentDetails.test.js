import { describe, expect, it } from 'vitest';
import {
  COMMITTENT_PINFL_LENGTH,
  COMMITTENT_TIN_LENGTH,
  buildFiscalDriveCommissionInfo,
  formatItemCommittentReceiptLine,
  parseCommittentIdentifier,
  resolveItemCommittent,
  resolveMultikassaCommitentTin,
  withSaleCommittentDetails,
} from './committentDetails.js';

describe('committentDetails (AUR-7)', () => {
  describe('parseCommittentIdentifier', () => {
    it('accepts valid 9-digit TIN', () => {
      expect(parseCommittentIdentifier('200523221')).toEqual({
        kind: 'TIN',
        value: '200523221',
      });
      expect(parseCommittentIdentifier(200523221)).toEqual({
        kind: 'TIN',
        value: '200523221',
      });
    });

    it('accepts valid 14-digit PINFL / JShShIR', () => {
      expect(parseCommittentIdentifier('12345678901234')).toEqual({
        kind: 'PINFL',
        value: '12345678901234',
      });
    });

    it('rejects all zeros', () => {
      expect(parseCommittentIdentifier('000000000')).toBeNull();
      expect(parseCommittentIdentifier('00000000000000')).toBeNull();
    });

    it('rejects invalid length and non-digits', () => {
      expect(parseCommittentIdentifier('')).toBeNull();
      expect(parseCommittentIdentifier('   ')).toBeNull();
      expect(parseCommittentIdentifier(null)).toBeNull();
      expect(parseCommittentIdentifier(undefined)).toBeNull();
      expect(parseCommittentIdentifier('12345678')).toBeNull(); // 8 digits
      expect(parseCommittentIdentifier('1234567890')).toBeNull(); // 10 digits
      expect(parseCommittentIdentifier('1234567890123')).toBeNull(); // 13 digits
      expect(parseCommittentIdentifier('123456789012345')).toBeNull(); // 15 digits
      expect(parseCommittentIdentifier('20052322A')).toBeNull();
      expect(parseCommittentIdentifier('1234567890123X')).toBeNull();
      expect(parseCommittentIdentifier('invalid-tin')).toBeNull();
    });
  });

  describe('resolveItemCommittent', () => {
    it('resolves TIN from commissionTin or commitentTin or commitent_tin', () => {
      expect(resolveItemCommittent({ commissionTin: '200523221' })).toEqual({
        kind: 'TIN',
        value: '200523221',
      });
      expect(resolveItemCommittent({ commitentTin: '200523221' })).toEqual({
        kind: 'TIN',
        value: '200523221',
      });
      expect(resolveItemCommittent({ commitent_tin: '200523221' })).toEqual({
        kind: 'TIN',
        value: '200523221',
      });
    });

    it('resolves PINFL from commissionPinfl or commitentPinfl', () => {
      expect(resolveItemCommittent({ commissionPinfl: '12345678901234' })).toEqual({
        kind: 'PINFL',
        value: '12345678901234',
      });
      expect(resolveItemCommittent({ commitentPinfl: '12345678901234' })).toEqual({
        kind: 'PINFL',
        value: '12345678901234',
      });
    });

    it('resolves from nested CommissionInfo object', () => {
      expect(resolveItemCommittent({ CommissionInfo: { TIN: '200523221' } })).toEqual({
        kind: 'TIN',
        value: '200523221',
      });
      expect(resolveItemCommittent({ CommissionInfo: { PINFL: '12345678901234' } })).toEqual({
        kind: 'PINFL',
        value: '12345678901234',
      });
    });

    it('returns null when item is empty or invalid', () => {
      expect(resolveItemCommittent(null)).toBeNull();
      expect(resolveItemCommittent({})).toBeNull();
      expect(resolveItemCommittent({ commissionTin: 'bad' })).toBeNull();
    });
  });

  describe('fiscal payload adapters', () => {
    it('resolveMultikassaCommitentTin produces string or empty', () => {
      expect(resolveMultikassaCommitentTin({ commissionTin: '200523221' })).toBe('200523221');
      expect(resolveMultikassaCommitentTin({ commissionPinfl: '12345678901234' })).toBe(
        '12345678901234',
      );
      expect(resolveMultikassaCommitentTin({})).toBe('');
      expect(resolveMultikassaCommitentTin({ commissionTin: 'bad' })).toBe('');
    });

    it('buildFiscalDriveCommissionInfo produces TIN or PINFL object or null', () => {
      expect(buildFiscalDriveCommissionInfo({ commissionTin: '200523221' })).toEqual({
        TIN: '200523221',
      });
      expect(buildFiscalDriveCommissionInfo({ commissionPinfl: '12345678901234' })).toEqual({
        PINFL: '12345678901234',
      });
      expect(buildFiscalDriveCommissionInfo({})).toBeNull();
      expect(buildFiscalDriveCommissionInfo({ commissionTin: '123' })).toBeNull();
    });
  });

  describe('formatItemCommittentReceiptLine', () => {
    it('formats Uzbek TIN line correctly', () => {
      const line = formatItemCommittentReceiptLine({ commissionTin: '200523221' });
      expect(line).toEqual({
        kind: 'TIN',
        label: 'Komitent (STIR)',
        value: '200523221',
        text: 'Komitent (STIR): 200523221',
      });
    });

    it('formats Uzbek PINFL line correctly', () => {
      const line = formatItemCommittentReceiptLine({ commissionPinfl: '12345678901234' });
      expect(line).toEqual({
        kind: 'PINFL',
        label: 'Komitent (JShShIR)',
        value: '12345678901234',
        text: 'Komitent (JShShIR): 12345678901234',
      });
    });

    it('supports custom i18n labels', () => {
      const line = formatItemCommittentReceiptLine(
        { commissionTin: '200523221' },
        { committentTin: 'Комитент (ИНН)' },
      );
      expect(line).toEqual({
        kind: 'TIN',
        label: 'Комитент (ИНН)',
        value: '200523221',
        text: 'Комитент (ИНН): 200523221',
      });
    });

    it('returns null when no committent info is present', () => {
      expect(formatItemCommittentReceiptLine({})).toBeNull();
      expect(formatItemCommittentReceiptLine({ commissionTin: 'bad' })).toBeNull();
    });
  });

  describe('withSaleCommittentDetails', () => {
    it('attaches committent from cartItems to sale.items', () => {
      const sale = {
        id: 10,
        items: [
          { productId: 101, productName: 'Tovar A', lineTotal: 50000 },
          { productId: 102, productName: 'Tovar B', lineTotal: 25000 },
        ],
      };
      const cartItems = [
        { productId: 101, name: 'Tovar A', commissionTin: '200523221' },
        { productId: 102, name: 'Tovar B' },
      ];

      const enriched = withSaleCommittentDetails(sale, cartItems);
      expect(enriched.items[0].commissionTin).toBe('200523221');
      expect(enriched.items[0].commitentTin).toBe('200523221');
      expect(enriched.items[1].commissionTin).toBeFalsy();
    });

    it('preserves existing sale item committent if already present', () => {
      const sale = {
        id: 11,
        items: [
          { productId: 201, commissionPinfl: '12345678901234', lineTotal: 10000 },
        ],
      };
      const enriched = withSaleCommittentDetails(sale, []);
      expect(enriched.items[0].commissionPinfl).toBe('12345678901234');
    });

    it('handles empty or non-array inputs safely', () => {
      expect(withSaleCommittentDetails(null)).toBeNull();
      expect(withSaleCommittentDetails({})).toEqual({});
    });
  });
});
