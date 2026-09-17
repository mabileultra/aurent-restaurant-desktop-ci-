import { describe, expect, it } from 'vitest';
import { assessPharmacyMarkLifecycle } from './pharmacyMarkLifecycle';
import {
  extractSerialFromMarkingCode,
  markingIdentityKey,
} from './pharmacyMarkIdentity';
import { planMarkedScan } from './pharmacyMarkedScanCart';

const product = { id: 'p1', barcode: '4780012345678', stockQuantity: 10 };

function mark(serial, crypto = 'CRYPTAA') {
  return `010478001234567821${serial}\u001d91${crypto}`;
}

describe('pharmacy mark lifecycle', () => {
  it('builds a stable identity from GTIN + serial even if crypto tail differs', () => {
    const a = mark('PACK001', 'AAAA');
    const b = mark('PACK001', 'BBBB');
    expect(extractSerialFromMarkingCode(a)).toBe('PACK001');
    expect(markingIdentityKey(a)).toBe(markingIdentityKey(b));
    expect(markingIdentityKey(a)).not.toBe(markingIdentityKey(mark('PACK002')));
  });

  it('rejects a repeat scan before it can enter the cart', () => {
    const code = mark('SAME01');
    const items = [{
      lineId: 'L1',
      productId: product.id,
      quantity: 1,
      productMarks: [code],
    }];
    expect(assessPharmacyMarkLifecycle({
      rawCode: mark('SAME01', 'OTHERTAIL'),
      cartItems: items,
    }).status).toBe('duplicate');
  });

  it('rejects a pending in-flight scan as duplicate', () => {
    const code = mark('PEND01');
    const key = markingIdentityKey(code);
    expect(assessPharmacyMarkLifecycle({
      rawCode: code,
      cartItems: [],
      pendingKeys: [key],
    }).status).toBe('duplicate');
  });

  it('rejects ASL withdrawn codes as sold', () => {
    expect(assessPharmacyMarkLifecycle({
      rawCode: mark('SOLD01'),
      cartItems: [],
      aslResult: { found: true, alreadySold: true, status: 'WITHDRAWN' },
    }).status).toBe('sold');
  });

  it('allows a new pack and appends another pack of the same product', () => {
    const first = planMarkedScan([], product, mark('NEW001'));
    expect(first.status).toBe('create');
    const items = [{
      lineId: 'L1',
      productId: product.id,
      quantity: 1,
      productMarks: [first.mark],
    }];
    expect(planMarkedScan(items, product, mark('NEW002'))).toMatchObject({
      status: 'append',
      quantity: 2,
    });
    expect(planMarkedScan(items, product, mark('NEW001', 'ZZZ')).status).toBe('duplicate');
  });
});
