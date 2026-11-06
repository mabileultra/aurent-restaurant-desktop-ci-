import { describe, expect, it } from 'vitest';
import { isAslMarkAlreadySold } from './aslMarkAlreadySold';

describe('isAslMarkAlreadySold', () => {
  it('treats withdrawn status as already sold', () => {
    expect(isAslMarkAlreadySold({ status: 'WITHDRAWN' })).toBe(true);
    expect(isAslMarkAlreadySold({ alreadySold: true })).toBe(true);
  });

  it('lets an introduced code through', () => {
    expect(isAslMarkAlreadySold({ status: 'INTRODUCED' })).toBe(false);
  });

  it('treats firstWithdrawCodeStateUnchanged as sold', () => {
    expect(isAslMarkAlreadySold({
      status: 'INTRODUCED',
      details: { firstWithdrawCodeStateUnchanged: true },
    })).toBe(true);
  });
});
