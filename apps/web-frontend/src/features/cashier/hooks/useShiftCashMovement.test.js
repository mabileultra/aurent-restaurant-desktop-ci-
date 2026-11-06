import { describe, expect, it, vi, beforeEach } from 'vitest';
import React, { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useShiftCashMovement } from './useShiftCashMovement';
import { cashierShiftApi } from '../../../api/cashierShift.api';
import { IDEMPOTENCY_HEADER } from '../../../utils/idempotencyKey';

vi.mock('../../../api/cashierShift.api', () => ({
  cashierShiftApi: {
    cashIn: vi.fn(),
    cashOut: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useShiftCashMovement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resets inputs and key when handleClose is called', () => {
    let hookResult = null;
    const onClose = vi.fn();

    function TestComponent() {
      hookResult = useShiftCashMovement({
        open: true,
        direction: 'IN',
        shiftId: 'shift-1',
        onClose,
        t: (k, opts) => opts?.defaultValue || k,
      });
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));
    expect(hookResult).not.toBeNull();

    hookResult.setAmountStr('50000');
    hookResult.setNote('Test note');
    hookResult.handleClose();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(hookResult.amountStr).toBe('');
    expect(hookResult.note).toBe('');
  });

  it('invalidates idempotency key when amount or direction changes during lifecycle', async () => {
    const keysCaptured = [];

    function TestComponent() {
      const [direction, setDirection] = useState('IN');
      const [amount, setAmount] = useState('100000');

      const hook = useShiftCashMovement({
        open: true,
        direction,
        shiftId: 'shift-1',
        t: (k, opts) => opts?.defaultValue || k,
      });

      // Capture request on submit
      if (keysCaptured.length === 0) {
        hook.setAmountStr(amount);
        hook.handleSubmit();
        const call1 = cashierShiftApi.cashIn.mock.calls[0];
        if (call1) {
          keysCaptured.push(call1[2].headers[IDEMPOTENCY_HEADER]);
        }
        // Change amount
        setAmount('200000');
      } else if (keysCaptured.length === 1) {
        hook.setAmountStr(amount);
        hook.handleSubmit();
        const call2 = cashierShiftApi.cashIn.mock.calls[1];
        if (call2) {
          keysCaptured.push(call2[2].headers[IDEMPOTENCY_HEADER]);
        }
        // Switch to cash out
        setDirection('OUT');
      } else if (keysCaptured.length === 2) {
        hook.handleSubmit();
        const call3 = cashierShiftApi.cashOut.mock.calls[0];
        if (call3) {
          keysCaptured.push(call3[2].headers[IDEMPOTENCY_HEADER]);
        }
      }

      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(keysCaptured.length).toBe(3);
    // All 3 keys must be distinct because amount and direction changed!
    expect(keysCaptured[0]).toBeTruthy();
    expect(keysCaptured[1]).toBeTruthy();
    expect(keysCaptured[2]).toBeTruthy();
    expect(keysCaptured[0]).not.toBe(keysCaptured[1]);
    expect(keysCaptured[1]).not.toBe(keysCaptured[2]);
  });
});
