import { describe, expect, it } from 'vitest';
import { classifyPharmacySearchScan } from './classifyPharmacySearchScan';
import { findProductByMarkingCode, planMarkedScan } from '../../marking';

const MARK = '010478001234567821SERIAL123\u001d91CRYPT';
const product = {
  id: 'p1',
  name: 'Nurofen',
  barcode: '4780012345678',
  stockQuantity: 10,
};

describe('единое поле поиска: штрихкод + маркировка', () => {
  it('различает текст, штрихкод и DataMatrix КМ', () => {
    expect(classifyPharmacySearchScan('нолпаза')).toEqual({ kind: 'text', value: 'нолпаза' });
    expect(classifyPharmacySearchScan('4780012345678')).toEqual({
      kind: 'barcode',
      value: '4780012345678',
    });
    expect(classifyPharmacySearchScan(MARK).kind).toBe('marking');
    expect(classifyPharmacySearchScan('').kind).toBe('empty');
  });

  it('находит товар по КМ из того же поля и сразу планирует +1 в чек', () => {
    const found = findProductByMarkingCode([product], MARK);
    expect(found).toEqual(product);

    const first = planMarkedScan([], found, MARK);
    expect(first).toMatchObject({ status: 'create', quantity: 1 });

    const items = [{
      lineId: 'L1',
      productId: product.id,
      quantity: 1,
      productMarks: [first.mark],
    }];
    const secondMark = '010478001234567821OTHERPACK\u001d91CRYPT';
    expect(planMarkedScan(items, found, secondMark)).toMatchObject({
      status: 'append',
      quantity: 2,
    });
    expect(planMarkedScan(items, found, MARK).status).toBe('duplicate');
  });

  it('не путает обычный EAN со сканом маркировки', () => {
    expect(classifyPharmacySearchScan('4227427277444').kind).toBe('barcode');
    expect(findProductByMarkingCode([product], '4227427277444')).toBeNull();
  });
});
