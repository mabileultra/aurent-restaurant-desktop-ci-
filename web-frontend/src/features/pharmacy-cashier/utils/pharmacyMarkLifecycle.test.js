import { describe, expect, it } from 'vitest';
import { assessPharmacyMarkLifecycle } from './pharmacyMarkLifecycle';
import {
  extractSerialFromMarkingCode,
  markingIdentityKey,
  markingIdentityKeys,
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
    expect(markingIdentityKeys(a).some((k) => markingIdentityKeys(b).includes(k))).toBe(true);
    expect(markingIdentityKey(a)).not.toBe(markingIdentityKey(mark('PACK002')));
  });

  it('allows consecutive different packs of the same product', () => {
    const items = [];
    const first = planMarkedScan(items, product, mark('PACK001'));
    expect(first.status).toBe('create');
    items.push({
      lineId: 'L1',
      productId: product.id,
      quantity: 1,
      productMarks: [first.mark],
    });
    const second = planMarkedScan(items, product, mark('PACK002'));
    expect(second).toMatchObject({ status: 'append', quantity: 2 });
    const third = planMarkedScan([
      { ...items[0], productMarks: [first.mark, second.mark], quantity: 2 },
    ], product, mark('PACK003'));
    expect(third).toMatchObject({ status: 'append', quantity: 3 });
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
    const keys = markingIdentityKeys(code);
    expect(assessPharmacyMarkLifecycle({
      rawCode: code,
      cartItems: [],
      pendingKeys: keys,
    }).status).toBe('duplicate');
  });

  it('rejects ASL withdrawn codes as sold', () => {
    expect(assessPharmacyMarkLifecycle({
      rawCode: mark('SOLD01'),
      cartItems: [],
      aslResult: { found: true, alreadySold: true, status: 'WITHDRAWN' },
    }).status).toBe('sold');
  });

  it('rejects locally sold marks even without ASL', () => {
    expect(assessPharmacyMarkLifecycle({
      rawCode: mark('LOCAL1'),
      cartItems: [],
      locallySold: true,
    }).status).toBe('sold');
  });

  it('treats GS-separated crypto as the same pack as concatenated crypto', () => {
    const base = '010307797292003921U=HqEW=YAVhNqy/Uasgl';
    const items = [{
      lineId: 'L1',
      productId: product.id,
      quantity: 1,
      productMarks: [`${base}91EE1192ABCDEF`],
    }];
    expect(assessPharmacyMarkLifecycle({
      rawCode: `${base}\u001d91FFFF\u001d92ZZZZ`,
      cartItems: items,
    }).status).toBe('duplicate');
    expect(planMarkedScan(items, product, `${base}\u001d91FFFF\u001d92ZZZZ`).status).toBe('duplicate');
  });
});
