// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePosAdvancePayment } from './usePosAdvancePayment';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('usePosAdvancePayment', () => {
  const mockT = (key) => key;

  it('validates customer before submitting credit/advance', async () => {
    const { result } = renderHook(() =>
      usePosAdvancePayment({
        creditCustomer: { selectedId: null },
        checkTotal: 100000,
        payMethod: 'advance',
        setStep: vi.fn(),
        onConfirm: vi.fn(),
        printReceiptEnabled: true,
        isPending: false,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.submitCreditWithCustomer();
    });

    expect(toast.error).toHaveBeenCalledWith('pos.creditCustomerRequired');
  });

  it('resets advance state', () => {
    const { result } = renderHook(() =>
      usePosAdvancePayment({
        creditCustomer: { selectedId: 1 },
        checkTotal: 100000,
        payMethod: 'advance',
        setStep: vi.fn(),
        onConfirm: vi.fn(),
        printReceiptEnabled: true,
        isPending: false,
        t: mockT,
      })
    );

    act(() => {
      result.current.setAdvanceAmountUsed(50000);
      result.current.resetAdvance();
    });

    expect(result.current.advanceAmountUsed).toBe(0);
  });
});
