import { describe, expect, it } from 'vitest';
import {
  COMMITTENT_PINFL_LENGTH,
  COMMITTENT_TIN_LENGTH,
  buildFiscalDriveCommissionInfo,
  formatItemCommittentReceiptLine,
  parseCommittentIdentifier,
  resolveItemCommittent,
  resolveMultikassaCommitentTin,
  resolveProviderItemCommittent,
  resolveSaleFiscalProvider,
  withSaleCommittentDetails,
} from './committentDetails.js';

describe('committentDetails (AUR-7 provider-aligned)', () => {
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

  describe('resolveMultikassaCommitentTin (criterion 2)', () => {
    it('sends 9-digit TIN from commissionTin or commitentTin', () => {
      expect(resolveMultikassaCommitentTin({ commissionTin: '200523221' })).toBe('200523221');
      expect(resolveMultikassaCommitentTin({ commitentTin: '200523221' })).toBe('200523221');
      expect(resolveMultikassaCommitentTin({ commitent_tin: '200523221' })).toBe('200523221');
    });

    it('sends 14-digit PINFL when present in legacy commissionTin/commitentTin', () => {
      expect(resolveMultikassaCommitentTin({ commissionTin: '12345678901234' })).toBe(
        '12345678901234',
      );
      expect(resolveMultikassaCommitentTin({ commitentTin: '12345678901234' })).toBe(
        '12345678901234',
      );
    });

    it('DOES NOT send new commissionPinfl / commitentPinfl to Multikassa (returns empty string)', () => {
      expect(resolveMultikassaCommitentTin({ commissionPinfl: '12345678901234' })).toBe('');
      expect(resolveMultikassaCommitentTin({ commitentPinfl: '12345678901234' })).toBe('');
    });

    it('returns empty string for missing or invalid values', () => {
      expect(resolveMultikassaCommitentTin({})).toBe('');
      expect(resolveMultikassaCommitentTin({ commissionTin: 'bad' })).toBe('');
      expect(resolveMultikassaCommitentTin({ commissionTin: '12345' })).toBe('');
    });
  });

  describe('buildFiscalDriveCommissionInfo (criterion 3 - legacy 1:1)', () => {
    it('produces TIN object for 9-digit identifier', () => {
      expect(buildFiscalDriveCommissionInfo({ commissionTin: '200523221' })).toEqual({
        TIN: '200523221',
      });
      expect(buildFiscalDriveCommissionInfo({ commitentTin: '200523221' })).toEqual({
        TIN: '200523221',
      });
    });

    it('produces PINFL object for 14-digit identifier (including new commissionPinfl)', () => {
      expect(buildFiscalDriveCommissionInfo({ commissionPinfl: '12345678901234' })).toEqual({
        PINFL: '12345678901234',
      });
      expect(buildFiscalDriveCommissionInfo({ commissionTin: '12345678901234' })).toEqual({
        PINFL: '12345678901234',
      });
    });

    it('returns null when absent or invalid', () => {
      expect(buildFiscalDriveCommissionInfo({})).toBeNull();
      expect(buildFiscalDriveCommissionInfo({ commissionTin: 'bad' })).toBeNull();
    });
  });

  describe('resolveProviderItemCommittent (criterion 1 & 2: payload value == receipt value)', () => {
    it('for MULTIKASSA: returns null when only new commissionPinfl is present (payload has nothing)', () => {
      const item = { commissionPinfl: '12345678901234' };
      expect(resolveMultikassaCommitentTin(item)).toBe('');
      expect(resolveProviderItemCommittent(item, 'MULTIKASSA')).toBeNull();
    });

    it('for MULTIKASSA: returns TIN when commissionTin (9 digits) is present (payload == receipt)', () => {
      const item = { commissionTin: '200523221' };
      const payloadVal = resolveMultikassaCommitentTin(item);
      const receiptResolved = resolveProviderItemCommittent(item, 'MULTIKASSA');
      expect(payloadVal).toBe('200523221');
      expect(receiptResolved).toEqual({ kind: 'TIN', value: '200523221' });
      expect(payloadVal).toBe(receiptResolved.value);
    });

    it('for MULTIKASSA: returns PINFL when commissionTin (14 digits) is present (payload == receipt)', () => {
      const item = { commissionTin: '12345678901234' };
      const payloadVal = resolveMultikassaCommitentTin(item);
      const receiptResolved = resolveProviderItemCommittent(item, 'MULTIKASSA');
      expect(payloadVal).toBe('12345678901234');
      expect(receiptResolved).toEqual({ kind: 'PINFL', value: '12345678901234' });
      expect(payloadVal).toBe(receiptResolved.value);
    });

    it('for FISCAL_DRIVE: returns PINFL when commissionPinfl is present (payload == receipt)', () => {
      const item = { commissionPinfl: '12345678901234' };
      const payloadObj = buildFiscalDriveCommissionInfo(item);
      const receiptResolved = resolveProviderItemCommittent(item, 'FISCAL_DRIVE');
      expect(payloadObj).toEqual({ PINFL: '12345678901234' });
      expect(receiptResolved).toEqual({ kind: 'PINFL', value: '12345678901234' });
      expect(payloadObj.PINFL).toBe(receiptResolved.value);
    });

    it('for FISCAL_DRIVE: returns TIN when commissionTin is present (payload == receipt)', () => {
      const item = { commissionTin: '200523221' };
      const payloadObj = buildFiscalDriveCommissionInfo(item);
      const receiptResolved = resolveProviderItemCommittent(item, 'FISCAL_DRIVE');
      expect(payloadObj).toEqual({ TIN: '200523221' });
      expect(receiptResolved).toEqual({ kind: 'TIN', value: '200523221' });
      expect(payloadObj.TIN).toBe(receiptResolved.value);
    });
  });

  describe('withSaleCommittentDetails end-to-end alignment (criterion 4)', () => {
    it('Multikassa + commissionPinfl -> payload has NO committent, receipt has NO committent', () => {
      const sale = {
        id: 1,
        fiscalProvider: 'MULTIKASSA',
        items: [{ productId: 10, productName: 'Test Tovar' }],
      };
      const cartItems = [{ productId: 10, commissionPinfl: '12345678901234' }];

      // Verify payload is empty
      expect(resolveMultikassaCommitentTin(cartItems[0])).toBe('');

      // Verify enriched sale item has no committent
      const enriched = withSaleCommittentDetails(sale, cartItems, { fiscalProvider: 'MULTIKASSA' });
      expect(enriched.items[0].commissionTin).toBeNull();
      expect(enriched.items[0].commissionPinfl).toBeNull();
      expect(formatItemCommittentReceiptLine(enriched.items[0])).toBeNull();
    });

    it('Multikassa + commissionTin (9 digits) -> payload has TIN, receipt has TIN', () => {
      const sale = {
        id: 2,
        fiscalProvider: 'MULTIKASSA',
        items: [{ productId: 20, productName: 'Agent tovari' }],
      };
      const cartItems = [{ productId: 20, commissionTin: '200523221' }];

      expect(resolveMultikassaCommitentTin(cartItems[0])).toBe('200523221');

      const enriched = withSaleCommittentDetails(sale, cartItems, { fiscalProvider: 'MULTIKASSA' });
      expect(enriched.items[0].commissionTin).toBe('200523221');
      const line = formatItemCommittentReceiptLine(enriched.items[0]);
      expect(line.text).toBe('Komitent (STIR): 200523221');
    });

    it('FiscalDrive + commissionPinfl -> payload has PINFL, receipt has PINFL', () => {
      const sale = {
        id: 3,
        fiscalProvider: 'FISCAL_DRIVE',
        items: [{ productId: 30, productName: 'Jismoniy shaxs tovari' }],
      };
      const cartItems = [{ productId: 30, commissionPinfl: '12345678901234' }];

      expect(buildFiscalDriveCommissionInfo(cartItems[0])).toEqual({ PINFL: '12345678901234' });

      const enriched = withSaleCommittentDetails(sale, cartItems, { fiscalProvider: 'FISCAL_DRIVE' });
      expect(enriched.items[0].commissionPinfl).toBe('12345678901234');
      const line = formatItemCommittentReceiptLine(enriched.items[0]);
      expect(line.text).toBe('Komitent (JShShIR): 12345678901234');
    });

    it('FiscalDrive + commissionTin (9 digits) -> payload has TIN, receipt has TIN', () => {
      const sale = {
        id: 4,
        fiscalProvider: 'FISCAL_DRIVE',
        items: [{ productId: 40, productName: 'Kompaniya tovari' }],
      };
      const cartItems = [{ productId: 40, commissionTin: '200523221' }];

      expect(buildFiscalDriveCommissionInfo(cartItems[0])).toEqual({ TIN: '200523221' });

      const enriched = withSaleCommittentDetails(sale, cartItems, { fiscalProvider: 'FISCAL_DRIVE' });
      expect(enriched.items[0].commissionTin).toBe('200523221');
      const line = formatItemCommittentReceiptLine(enriched.items[0]);
      expect(line.text).toBe('Komitent (STIR): 200523221');
    });
  });
});
