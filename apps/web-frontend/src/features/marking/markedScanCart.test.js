import { describe, expect, it } from 'vitest';
import { planMarkedScan } from './markedScanCart';

const product = { id: 'p1', name: 'Терафлю', stockQuantity: 10 };

describe('planMarkedScan', () => {
  it('does not change a line that has no marking', () => {
    const items = [{ lineId: 'plain', productId: 'p1', quantity: 2, productMarks: null }];
    const plan = planMarkedScan(items, product, '010478001234567821AAAA');
    expect(plan.status).toBe('create');
    expect(items[0].quantity).toBe(2);
  });

  it('counts each new mark separately and ignores a repeat', () => {
    const items = [{
      lineId: 'marked',
      productId: 'p1',
      quantity: 1,
      productMarks: ['010478001234567821AAAA'],
    }];
    const second = planMarkedScan(items, product, '010478001234567821BBBB');
    expect(second).toMatchObject({ status: 'append', quantity: 2 });
    expect(planMarkedScan(items, product, '010478001234567821AAAA').status).toBe('duplicate');
  });

  it('block KM adds unitsInPack pieces and refuses when stock is short', () => {
    const block = {
      id: 'p1',
      stockQuantity: 20,
      sellAsBlock: true,
      unitsInPack: 15,
    };
    expect(planMarkedScan([], block, '0114780131183003217AAAA')).toMatchObject({
      status: 'create',
      quantity: 15,
    });
    expect(planMarkedScan([], { ...block, stockQuantity: 10 }, '0114780131183003217AAAA').status)
      .toBe('stock');
  });
});
