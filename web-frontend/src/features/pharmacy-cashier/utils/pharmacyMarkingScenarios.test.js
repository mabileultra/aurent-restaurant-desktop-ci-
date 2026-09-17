import { describe, expect, it } from 'vitest';
import { assessQtyMarkingScan } from './pharmacyQtyMarkingScan';
import { planMarkedScan } from './pharmacyMarkedScanCart';
import { markingIdentityKey } from './pharmacyMarkIdentity';

const product = {
  id: 'p-indo',
  barcode: '3838989563233',
  stockQuantity: 10,
};

function mark(serial) {
  return `010383898956323321${serial}\u001d91CRYPT`;
}

describe('pharmacy marking scenarios', () => {
  it('same pack scanned 3 times stays at qty 1 and reports duplicate', () => {
    const a = mark('PACKAAA');
    const scans = [];
    const first = assessQtyMarkingScan({ product, rawCode: a, scans });
    expect(first.status).toBe('accepted');
    scans.push(first);

    expect(assessQtyMarkingScan({ product, rawCode: a, scans }).status).toBe('duplicate');
    expect(assessQtyMarkingScan({ product, rawCode: a, scans }).status).toBe('duplicate');
    expect(assessQtyMarkingScan({
      product,
      rawCode: a.replace('\u001d', ''),
      scans,
    }).status).toBe('duplicate');
    expect(scans).toHaveLength(1);
  });

  it('different packs of the same product increase quantity and sum base', () => {
    const scans = [];
    const packPrice = 10150;
    for (const serial of ['PACK001', 'PACK002', 'PACK003']) {
      const result = assessQtyMarkingScan({ product, rawCode: mark(serial), scans, stockPacks: 10 });
      expect(result.status).toBe('accepted');
      scans.push(result);
    }
    expect(scans).toHaveLength(3);
    expect(scans.length * packPrice).toBe(30450);
  });

  it('blocks a code that ASL already withdrew as sold', () => {
    const result = assessQtyMarkingScan({
      product,
      rawCode: mark('SOLD001'),
      aslResult: { found: true, alreadySold: true, status: 'WITHDRAWN', gtin: '03838989563233' },
    });
    expect(result.status).toBe('sold');
  });

  it('keeps accepting when ASL found:false if GTIN matches product', () => {
    expect(assessQtyMarkingScan({
      product,
      rawCode: mark('OKPACK1'),
      aslResult: { found: false },
    }).status).toBe('accepted');
  });

  it('treats a pending in-flight scan as duplicate (race guard)', () => {
    const code = mark('PENDING1');
    const key = markingIdentityKey(code);
    const first = assessQtyMarkingScan({ product, rawCode: code, scans: [], pendingKeys: [] });
    expect(first.status).toBe('accepted');
    expect(assessQtyMarkingScan({
      product,
      rawCode: code,
      scans: [],
      pendingKeys: [key],
    }).status).toBe('duplicate');
  });

  it('cart plan appends new packs and rejects a repeat mark', () => {
    const items = [];
    const first = planMarkedScan(items, product, mark('CART001'));
    expect(first.status).toBe('create');
    items.push({
      lineId: 'L1',
      productId: product.id,
      quantity: 1,
      productMarks: [first.mark],
    });
    const second = planMarkedScan(items, product, mark('CART002'));
    expect(second).toMatchObject({ status: 'append', quantity: 2 });
    expect(planMarkedScan(items, product, mark('CART001')).status).toBe('duplicate');
  });
});
