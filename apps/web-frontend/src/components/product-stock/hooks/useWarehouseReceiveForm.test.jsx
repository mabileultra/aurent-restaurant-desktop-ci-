// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWarehouseReceiveForm } from './useWarehouseReceiveForm';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useWarehouseReceiveForm', () => {
  const qc = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const mockT = (key, opt) => (opt?.field ? `${key}:${opt.field}` : key);

  it('validates product requirement on submit', () => {
    const { result } = renderHook(
      () =>
        useWarehouseReceiveForm({
          open: true,
          initialProduct: null,
          onSaved: vi.fn(),
          onClose: vi.fn(),
          t: mockT,
        }),
      { wrapper }
    );

    const fakeEvent = { preventDefault: vi.fn() };
    act(() => {
      result.current.submit(fakeEvent);
    });

    expect(toast.error).toHaveBeenCalled();
  });
});
