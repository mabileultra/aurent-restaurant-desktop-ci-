import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPosBarcodeHitCache,
  getPosBarcodeHit,
  rememberPosBarcodeHit,
  setPosBarcodeHit,
} from './posBarcodeHitCache';

describe('posBarcodeHitCache', () => {
  beforeEach(() => clearPosBarcodeHitCache());

  it('stores and returns by store+code', () => {
    const product = { id: 7, barcode: '111' };
    setPosBarcodeHit(3, '111', product);
    expect(getPosBarcodeHit(3, '111')).toBe(product);
    expect(getPosBarcodeHit(9, '111')).toBeNull();
  });

  it('rememberPosBarcodeHit writes all candidate forms', () => {
    const product = { id: 1 };
    rememberPosBarcodeHit(1, ['8801046877388', '08801046877388'], product);
    expect(getPosBarcodeHit(1, '8801046877388')).toBe(product);
    expect(getPosBarcodeHit(1, '08801046877388')).toBe(product);
  });
});
