import { describe, expect, it } from 'vitest';
import { buildMarkingValidationProducts } from './buildMarkingValidationProducts';

const FULL = '010509987308971221uC*NTOg\u001d934444';
const KI = '010509987308971221uC*NTOg';

describe('buildMarkingValidationProducts', () => {
  it('maps marked line to validation-onkm product', () => {
    const [product] = buildMarkingValidationProducts([
      { ikpu: '02208005001025008', packageCode: '1077302', quantity: 1, productMarks: [FULL], commitentTin: '310189130' },
    ]);
    expect(product).toEqual({
      productCode: '02208005001025008',
      packageCode: '1077302',
      amount: 1,
      kmIds: [KI],
      fullKmIds: [FULL],
      commitentTin: '310189130',
    });
  });

  it('skips unmarked lines and duplicate codes', () => {
    const products = buildMarkingValidationProducts([
      { ikpu: '1', quantity: 2 },
      { ikpu: '02208005001025008', quantity: 2, productMarks: [FULL, FULL], commitentTin: '123' },
    ]);
    expect(products).toHaveLength(1);
    expect(products[0].kmIds).toEqual([KI]);
    expect(products[0].commitentTin).toBeNull();
  });
});
