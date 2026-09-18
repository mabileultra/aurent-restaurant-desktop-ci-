import { describe, expect, it } from 'vitest';
import { shouldAutoPromptCashierShift } from './shouldAutoPromptCashierShift';

describe('shouldAutoPromptCashierShift', () => {
  it('prompts only after fetch when shift is closed', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftIsOpen: false,
        shiftQueryError: null,
      }),
    ).toBe(true);
  });

  it('does not prompt while open', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftIsOpen: true,
        shiftQueryError: null,
      }),
    ).toBe(false);
  });

  it('does not prompt before fetch', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: false,
        shiftIsOpen: false,
        shiftQueryError: null,
      }),
    ).toBe(false);
  });

  it('does not prompt on auth errors', () => {
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftIsOpen: false,
        shiftQueryError: { response: { status: 401 } },
      }),
    ).toBe(false);
    expect(
      shouldAutoPromptCashierShift({
        shiftFetched: true,
        shiftIsOpen: false,
        shiftQueryError: { response: { status: 403 } },
      }),
    ).toBe(false);
  });
});
