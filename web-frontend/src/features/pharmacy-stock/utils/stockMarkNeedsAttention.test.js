import { describe, expect, it } from 'vitest';
import { stockMarkAttentionKind, stockMarkNeedsAttention } from './stockMarkNeedsAttention';

describe('stockMarkNeedsAttention', () => {
  it('flags pending withdraw', () => {
    expect(stockMarkNeedsAttention({ status: 'PENDING_WITHDRAW' })).toBe(true);
    expect(stockMarkAttentionKind({ status: 'PENDING_WITHDRAW' })).toBe('pending');
  });

  it('flags error even if sold', () => {
    expect(stockMarkNeedsAttention({ status: 'SOLD', lastWithdrawError: 'timeout' })).toBe(true);
    expect(stockMarkAttentionKind({ status: 'SOLD', lastWithdrawError: 'timeout' })).toBe('error');
  });

  it('treats clean sold as ok', () => {
    expect(stockMarkNeedsAttention({ status: 'SOLD', aslStatus: 'WITHDRAWN' })).toBe(false);
    expect(stockMarkAttentionKind({ status: 'SOLD' })).toBe('ok');
  });
});
