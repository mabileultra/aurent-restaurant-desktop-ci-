import { describe, expect, it } from 'vitest';
import {
  calculateRemainingDisplayTime,
  DEFAULT_MIN_SPINNER_DURATION_MS,
  DEFAULT_SPINNER_DELAY_MS,
} from './useDelayedLoading';

describe('useDelayedLoading and calculateRemainingDisplayTime', () => {
  it('has default delay and minDuration adhering to design guidelines (250ms and 400ms)', () => {
    expect(DEFAULT_SPINNER_DELAY_MS).toBe(250);
    expect(DEFAULT_MIN_SPINNER_DURATION_MS).toBe(400);
  });

  it('returns 0 when spinner was never shown (shownAt is null)', () => {
    expect(calculateRemainingDisplayTime(null, 1000, 400)).toBe(0);
  });

  it('calculates remaining duration accurately when elapsed time is less than minDuration', () => {
    const shownAt = 1000;
    const now = 1150; // 150ms elapsed
    // remaining = 400 - 150 = 250ms
    expect(calculateRemainingDisplayTime(shownAt, now, 400)).toBe(250);
  });

  it('returns 0 when elapsed time equals or exceeds minDuration', () => {
    const shownAt = 1000;
    const nowExact = 1400; // 400ms elapsed
    expect(calculateRemainingDisplayTime(shownAt, nowExact, 400)).toBe(0);

    const nowExceeded = 1600; // 600ms elapsed
    expect(calculateRemainingDisplayTime(shownAt, nowExceeded, 400)).toBe(0);
  });

  it('safely handles edge case when clock jitter makes now < shownAt', () => {
    const shownAt = 1000;
    const nowPast = 900;
    expect(calculateRemainingDisplayTime(shownAt, nowPast, 400)).toBe(400);
  });
});
