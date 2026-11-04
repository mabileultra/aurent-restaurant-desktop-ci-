import { describe, expect, it } from 'vitest';
import {
  resolveActiveShiftForModalAction,
  resolveShiftModalSession,
} from './shiftModalSession';

describe('resolveShiftModalSession', () => {
  it('shows open actions only for fresh OPEN shift', () => {
    const fresh = { id: 's1', status: 'OPEN' };
    expect(resolveShiftModalSession(fresh)).toEqual({
      sessionOpen: true,
      sessionShift: fresh,
    });
  });

  it('does not flash Close when fresh shift is null/closed (stale OPEN ignored)', () => {
    expect(resolveShiftModalSession(null)).toEqual({
      sessionOpen: false,
      sessionShift: null,
    });
    expect(resolveShiftModalSession({ id: 's1', status: 'CLOSED' })).toEqual({
      sessionOpen: false,
      sessionShift: null,
    });
  });
});

describe('resolveActiveShiftForModalAction', () => {
  it('allows Close/X only with fresh OPEN id', () => {
    expect(
      resolveActiveShiftForModalAction({ id: 's1', status: 'OPEN' }),
    ).toEqual({ id: 's1', status: 'OPEN' });
  });

  it('blocks actions without open session shift', () => {
    expect(resolveActiveShiftForModalAction(null)).toBeNull();
    expect(resolveActiveShiftForModalAction({ id: 's1', status: 'CLOSED' })).toBeNull();
    expect(resolveActiveShiftForModalAction({ status: 'OPEN' })).toBeNull();
  });
});
