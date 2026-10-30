import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCashierCashMovement } from './useCashierCashMovement';

globalThis.React = React;

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useCashierCashMovement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const t = (k, opts) => opts?.defaultValue || k;

  function renderHookHelper(props) {
    let hookResult = null;
    function TestComponent() {
      hookResult = useCashierCashMovement(props);
      return React.createElement('div', null, hookResult.cashMovement || 'EMPTY');
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestComponent)
      )
    );

    return hookResult;
  }

  it('initializes with null cashMovement', () => {
    const hook = renderHookHelper({ shiftIsOpen: true, storeId: 'store-1', t });
    expect(hook.cashMovement).toBe(null);
    expect(typeof hook.setCashMovement).toBe('function');
    expect(typeof hook.handleCashIn).toBe('function');
    expect(typeof hook.handleCashOut).toBe('function');
    expect(typeof hook.handleCashMovementSuccess).toBe('function');
  });

  it('blocks cash in/out and triggers toast when shift is closed', () => {
    const hook = renderHookHelper({ shiftIsOpen: false, storeId: 'store-1', t });
    expect(hook.cashMovement).toBe(null);

    hook.handleCashIn();
    expect(toast.error).toHaveBeenCalledWith('Kirim qilish uchun smena ochiq bo‘lishi kerak');

    hook.handleCashOut();
    expect(toast.error).toHaveBeenCalledWith('Chiqim qilish uchun smena ochiq bo‘lishi kerak');
  });
});
