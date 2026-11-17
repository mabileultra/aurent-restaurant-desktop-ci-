// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReturnMutations } from './useReturnMutations';
import { returnApi } from '../../../api';

vi.mock('../../../api', () => ({
  returnApi: {
    updateReason: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useReturnMutations', () => {
  const qc = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const mockT = (key, opt) => opt?.defaultValue || key;

  it('rejects updateReason when pharmacy company', async () => {
    const { result } = renderHook(
      () =>
        useReturnMutations({
          catalogKind: 'pharmacy',
          qc,
          t: mockT,
          setEditRow: vi.fn(),
          setMenuOpenId: vi.fn(),
        }),
      { wrapper }
    );

    await act(async () => {
      try {
        await result.current.updateReasonMutation.mutateAsync({ id: 1, reason: 'Test' });
      } catch (err) {
        expect(err.message).toBe('Изменение причины возврата для аптеки пока недоступно');
      }
    });
  });

  it('calls returnApi.updateReason when grocery company', async () => {
    returnApi.updateReason.mockResolvedValueOnce({ data: { success: true } });
    const setEditRow = vi.fn();
    const { result } = renderHook(
      () =>
        useReturnMutations({
          catalogKind: 'grocery',
          qc,
          t: mockT,
          setEditRow,
          setMenuOpenId: vi.fn(),
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.updateReasonMutation.mutateAsync({ id: 2, reason: 'Broken item' });
    });

    expect(returnApi.updateReason).toHaveBeenCalledWith(2, { reason: 'Broken item' });
    expect(setEditRow).toHaveBeenCalledWith(null);
  });
});
