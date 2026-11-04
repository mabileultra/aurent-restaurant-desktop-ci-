import { describe, expect, it } from 'vitest';
import {
  resolveMySalesShiftId,
  resolveStableShiftIsOpen,
} from './cashierShiftStability';

describe('resolveStableShiftIsOpen', () => {
  it('keeps previous open while refetching (no flicker to closed)', () => {
    expect(
      resolveStableShiftIsOpen({
        previousIsOpen: true,
        shiftFetching: true,
        shiftFetched: true,
        shiftStatus: 'OPEN',
      }),
    ).toBe(true);

    expect(
      resolveStableShiftIsOpen({
        previousIsOpen: true,
        shiftFetching: true,
        shiftFetched: true,
        // stale cache may briefly look closed / missing during key churn
        shiftStatus: null,
      }),
    ).toBe(true);
  });

  it('keeps previous closed while refetching (no flash of open)', () => {
    expect(
      resolveStableShiftIsOpen({
        previousIsOpen: false,
        shiftFetching: true,
        shiftFetched: true,
        shiftStatus: 'OPEN',
      }),
    ).toBe(false);
  });

  it('does not change before first fetch completes', () => {
    expect(
      resolveStableShiftIsOpen({
        previousIsOpen: false,
        shiftFetching: false,
        shiftFetched: false,
        shiftStatus: 'OPEN',
      }),
    ).toBe(false);
  });

  it('updates to OPEN only after settled fetch', () => {
    expect(
      resolveStableShiftIsOpen({
        previousIsOpen: false,
        shiftFetching: false,
        shiftFetched: true,
        shiftStatus: 'OPEN',
      }),
    ).toBe(true);
  });

  it('updates to closed only after settled fetch', () => {
    expect(
      resolveStableShiftIsOpen({
        previousIsOpen: true,
        shiftFetching: false,
        shiftFetched: true,
        shiftStatus: 'CLOSED',
      }),
    ).toBe(false);

    expect(
      resolveStableShiftIsOpen({
        previousIsOpen: true,
        shiftFetching: false,
        shiftFetched: true,
        shiftStatus: null,
      }),
    ).toBe(false);
  });
});

describe('resolveMySalesShiftId', () => {
  it('returns shift id only when shift is confirmed open', () => {
    expect(
      resolveMySalesShiftId({
        shiftIsOpen: true,
        shift: { id: 'shift-1', status: 'OPEN' },
      }),
    ).toBe('shift-1');
  });

  it('returns null when latch says closed even if stale shift object remains', () => {
    expect(
      resolveMySalesShiftId({
        shiftIsOpen: false,
        shift: { id: 'shift-stale', status: 'OPEN' },
      }),
    ).toBeNull();
  });

  it('returns null without id', () => {
    expect(resolveMySalesShiftId({ shiftIsOpen: true, shift: {} })).toBeNull();
    expect(resolveMySalesShiftId({ shiftIsOpen: true, shift: null })).toBeNull();
  });
});
