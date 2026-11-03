import { describe, expect, it } from 'vitest';
import {
  groupTicketsBySimplePhase,
  nextSimpleStatus,
  simplePhaseOf,
} from '../../../../src/restaurant/pos/utils/kitchenSimpleBoard';

describe('kitchenSimpleBoard', () => {
  it('maps NEW/ACCEPTED to ARRIVED and PREPARING to COOKING', () => {
    expect(simplePhaseOf({ status: 'NEW' })).toBe('ARRIVED');
    expect(simplePhaseOf({ status: 'ACCEPTED' })).toBe('ARRIVED');
    expect(simplePhaseOf({ status: 'PREPARING' })).toBe('COOKING');
    expect(simplePhaseOf({ status: 'READY' })).toBe('READY');
  });

  it('advances with two taps to READY then SERVED', () => {
    expect(nextSimpleStatus({ status: 'NEW' })).toBe('PREPARING');
    expect(nextSimpleStatus({ status: 'ACCEPTED' })).toBe('PREPARING');
    expect(nextSimpleStatus({ status: 'PREPARING' })).toBe('READY');
    expect(nextSimpleStatus({ status: 'READY' })).toBe('SERVED');
  });

  it('groups tickets into three color lanes', () => {
    const { ARRIVED, COOKING, READY } = groupTicketsBySimplePhase([
      { id: 1, status: 'NEW' },
      { id: 2, status: 'ACCEPTED' },
      { id: 3, status: 'PREPARING' },
      { id: 4, status: 'READY' },
      { id: 5, status: 'SERVED' },
    ]);
    expect(ARRIVED.map((t) => t.id)).toEqual([1, 2]);
    expect(COOKING.map((t) => t.id)).toEqual([3]);
    expect(READY.map((t) => t.id)).toEqual([4]);
  });
});
