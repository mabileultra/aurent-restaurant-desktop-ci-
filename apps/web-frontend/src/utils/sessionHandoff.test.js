import { describe, it, expect } from 'vitest';
import { safeNextPath } from './sessionHandoff';

describe('sessionHandoff', () => {
  it('safeNextPath allows only absolute in-app paths', () => {
    expect(safeNextPath('/products')).toBe('/products');
    expect(safeNextPath('/stock/products')).toBe('/stock/products');
    expect(safeNextPath('products')).toBe('');
    expect(safeNextPath('//evil.com')).toBe('');
    expect(safeNextPath('https://evil.com')).toBe('');
    expect(safeNextPath('/ok?x=1')).toBe('/ok?x=1');
  });
});
