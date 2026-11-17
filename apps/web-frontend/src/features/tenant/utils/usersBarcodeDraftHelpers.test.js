import { describe, it, expect, vi } from 'vitest';
import {
  parsePreviewPrice,
  createDraftFromTasnif,
  lookupTasnifByBarcodeOrQuery,
} from './usersBarcodeDraftHelpers';

describe('usersBarcodeDraftHelpers', () => {
  describe('parsePreviewPrice', () => {
    it('parses valid price numbers and strings', () => {
      expect(parsePreviewPrice('15000')).toBe(15000);
      expect(parsePreviewPrice('15000,50')).toBe(15000.5);
      expect(parsePreviewPrice('')).toBe(0);
      expect(parsePreviewPrice('invalid')).toBe(0);
      expect(parsePreviewPrice('-500')).toBe(0);
    });
  });

  describe('createDraftFromTasnif', () => {
    it('returns null if item has no name', () => {
      expect(createDraftFromTasnif(null)).toBeNull();
      expect(createDraftFromTasnif({})).toBeNull();
    });

    it('creates draft from tasnif item with package', () => {
      const item = {
        name: 'Aspirin',
        mxik: '010101',
      };
      const pkg = { nameRu: 'упаковка', nameUz: 'quti' };
      const draft = createDraftFromTasnif(item, pkg, '478000123', 'uz');

      expect(draft.name).toBe('Aspirin (quti)');
      expect(draft.mxik).toBe('010101');
      expect(draft.source).toBe('tasnif');
    });
  });

  describe('lookupTasnifByBarcodeOrQuery', () => {
    it('calls tasnifApi.lookup with digits only for long barcodes', async () => {
      const tasnifApi = {
        lookup: vi.fn().mockResolvedValue({ data: { name: 'Item', mxik: '123' } }),
      };
      const res = await lookupTasnifByBarcodeOrQuery('4780001234567', 'uz', tasnifApi);
      expect(res).toEqual({ name: 'Item', mxik: '123' });
      expect(tasnifApi.lookup).toHaveBeenCalled();
    });
  });
});
