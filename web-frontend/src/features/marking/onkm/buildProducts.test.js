import { describe, expect, it } from 'vitest';
import { buildMarkingValidationProducts } from './buildProducts';

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

  it('берёт MXIK если ikpu пустой', () => {
    const [product] = buildMarkingValidationProducts([
      { mxik: '02208001001231004', packageCode: '1803483', quantity: 1, productMarks: [KI] },
    ]);
    expect(product.productCode).toBe('02208001001231004');
  });

  it('Aurent JSON for списанный Чёрное золото — КИ без хвоста 93, full = скан', () => {
    const scanned = '0104780131182498217?ыПдК793Тоы2';
    const [product] = buildMarkingValidationProducts([
      { ikpu: '02208001001231004', packageCode: '1803483', quantity: 1, productMarks: [scanned] },
    ]);
    expect(product).toEqual({
      productCode: '02208001001231004',
      packageCode: '1803483',
      amount: 1,
      kmIds: ['0104780131182498217?ыПдК7'],
      fullKmIds: [scanned],
      commitentTin: null,
    });
  });
});
