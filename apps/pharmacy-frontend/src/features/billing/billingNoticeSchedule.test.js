import { describe, expect, it } from 'vitest';
import {
  BILLING_NOTICE_HOURS,
  localPartsInZone,
  msUntilNextSlot,
  pendingCatchUpSlots,
  passedSlotsToday,
  storageKey,
} from './billingNoticeSchedule';

/** Tashkent local → Date via UTC+5. */
function atTashkent(y, m, d, hour, minute = 0) {
  return new Date(Date.UTC(y, m - 1, d, hour - 5, minute, 0));
}

describe('billingNoticeSchedule', () => {
  it('localPartsInZone maps Tashkent wall clock', () => {
    const parts = localPartsInZone(atTashkent(2026, 10, 27, 20, 0));
    expect(parts.dayKey).toBe('2026-10-27');
    expect(parts.hour).toBe(20);
  });

  it('catch-up at 20:00 returns 10 and 15 when nothing shown', () => {
    const { hours } = pendingCatchUpSlots([], atTashkent(2026, 10, 27, 20, 0));
    expect(hours).toEqual([10, 15]);
  });

  it('catch-up skips already shown slots', () => {
    const { hours } = pendingCatchUpSlots(['10'], atTashkent(2026, 10, 27, 20, 0));
    expect(hours).toEqual([15]);
  });

  it('at 21:00 all three are pending if none shown', () => {
    const { hours } = pendingCatchUpSlots([], atTashkent(2026, 10, 27, 21, 0));
    expect(hours).toEqual([...BILLING_NOTICE_HOURS]);
  });

  it('before 10:00 no catch-up', () => {
    const { hours } = pendingCatchUpSlots([], atTashkent(2026, 10, 27, 9, 30));
    expect(hours).toEqual([]);
  });

  it('after catch-up of 10+15 at 20:00 nothing pending until 21', () => {
    const { hours } = pendingCatchUpSlots(['10', '15'], atTashkent(2026, 10, 27, 20, 0));
    expect(hours).toEqual([]);
    expect(passedSlotsToday(atTashkent(2026, 10, 27, 21, 5)).passed).toEqual([10, 15, 21]);
    expect(pendingCatchUpSlots(['10', '15'], atTashkent(2026, 10, 27, 21, 5)).hours).toEqual([21]);
  });

  it('throttled wake at 16:00 after morning open catches 10 and 15', () => {
    const { hours } = pendingCatchUpSlots([], atTashkent(2026, 10, 27, 16, 0));
    expect(hours).toEqual([10, 15]);
  });

  it('msUntilNextSlot from 20:00 targets 21:00', () => {
    const now = atTashkent(2026, 10, 27, 20, 0);
    const ms = msUntilNextSlot(now);
    expect(ms).toBe(60 * 60 * 1000);
  });

  it('msUntilNextSlot from 21:30 targets tomorrow 10:00', () => {
    const now = atTashkent(2026, 10, 27, 21, 30);
    const ms = msUntilNextSlot(now);
    const expected = atTashkent(2026, 10, 28, 10, 0).getTime() - now.getTime();
    expect(ms).toBe(expected);
  });

  it('msUntilNextSlot from 09:00 targets 10:00', () => {
    const now = atTashkent(2026, 10, 27, 9, 0);
    expect(msUntilNextSlot(now)).toBe(60 * 60 * 1000);
  });

  it('storageKey is stable', () => {
    expect(storageKey(42, '2026-10-27')).toBe('aurent.billingNotice.42.2026-10-27');
  });
});
