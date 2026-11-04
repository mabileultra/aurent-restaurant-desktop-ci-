import { describe, expect, it } from 'vitest';
import { resolveMenuVariantFiscal } from '../../src/restaurant/admin/utils/menuVariantFiscalFields.js';

describe('resolveMenuVariantFiscal', () => {
  it('keeps own ikpu when present', () => {
    expect(resolveMenuVariantFiscal({ ikpu: '111', packageCode: '1' }, [
      { ikpu: '222' },
    ]).ikpu).toBe('111');
  });

  it('falls back to a sibling with ikpu', () => {
    expect(resolveMenuVariantFiscal({ ikpu: '' }, [
      { ikpu: null },
      { ikpu: '032', packageCode: '154' },
    ])).toEqual({
      ikpu: '032',
      packageCode: '154',
      unitOfMeasure: null,
      unitMeasureCode: null,
      barcode: null,
      markedProduct: false,
    });
  });
});
