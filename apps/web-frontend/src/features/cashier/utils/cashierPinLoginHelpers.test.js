// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { resolvePinHomePath, useCashierPinKeyboard } from './cashierPinLoginHelpers';

vi.mock('../../../utils/fetchMainAppAccess', () => ({
  fetchMainAppAccess: vi.fn().mockResolvedValue({
    access: { ok: true },
    businessPayload: { defaultTypeCode: 'RESTAURANT' },
    fetchError: false,
  }),
}));

describe('cashierPinLoginHelpers', () => {
  it('resolves path for WAITER role without calling network', async () => {
    const res = await resolvePinHomePath('WAITER');
    expect(res.access.ok).toBe(false);
    expect(res.access.reason).toBe('restaurant_role');
  });

  it('handles keyboard input for digits and actions', () => {
    const pressDigit = vi.fn();
    const backspace = vi.fn();
    const submit = vi.fn();

    renderHook(() =>
      useCashierPinKeyboard({
        loading: false,
        pressDigit,
        backspace,
        submit,
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '5' }));
    expect(pressDigit).toHaveBeenCalledWith('5');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(backspace).toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(submit).toHaveBeenCalled();
  });
});
