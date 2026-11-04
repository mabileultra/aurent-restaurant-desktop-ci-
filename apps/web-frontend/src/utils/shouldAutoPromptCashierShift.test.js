import { describe, expect, it } from 'vitest';
import { shouldAutoPromptCashierShift } from './shouldAutoPromptCashierShift';

describe('shouldAutoPromptCashierShift', () => {
  it('prompts only after settled fetch when shift is closed', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftFetching: false,
        shiftStatus: null,
        shiftQueryError: null,
      }),
    ).toBe(true);
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftFetching: false,
        shiftStatus: 'CLOSED',
        shiftQueryError: null,
      }),
    ).toBe(true);
  });

  it('does not prompt while the shift is already OPEN', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftFetching: false,
        shiftStatus: 'OPEN',
        shiftQueryError: null,
      }),
    ).toBe(false);
  });

  it('does not prompt on reload before the latch catches up (fetched OPEN, still fetching or not)', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftFetching: false,
        shiftStatus: 'OPEN',
        shiftQueryError: null,
      }),
    ).toBe(false);
  });

  it('does not prompt before fetch', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: false,
        shiftFetching: false,
        shiftStatus: null,
        shiftQueryError: null,
      }),
    ).toBe(false);
  });

  it('does not prompt while refetch is in flight (avoids flash on update)', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftFetching: true,
        shiftStatus: null,
        shiftQueryError: null,
      }),
    ).toBe(false);
  });

  it('does not prompt on auth errors', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftFetching: false,
        shiftStatus: null,
        shiftQueryError: { response: { status: 401 } },
      }),
    ).toBe(false);
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftFetching: false,
        shiftStatus: null,
        shiftQueryError: { response: { status: 403 } },
      }),
    ).toBe(false);
  });
});
