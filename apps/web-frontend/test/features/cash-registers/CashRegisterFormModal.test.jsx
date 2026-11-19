// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

globalThis.React = React;
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CashRegisterFormModal from '../../../src/features/cash-registers/components/CashRegisterFormModal';

const apiMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  storesGetAll: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'cashRegisters.fiscalCardConflictWithRegister') {
        return `Этот фискальный модуль уже привязан к кассе №${opts?.number} (${opts?.store})`;
      }
      if (key === 'common.save') return 'Сохранить';
      if (key === 'common.cancel') return 'Отмена';
      if (key === 'cashRegisters.formStorePlaceholder') return 'Выберите магазин';
      return key;
    },
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: apiMocks.toastError,
    success: apiMocks.toastSuccess,
  },
}));

vi.mock('../../../src/services/api', () => ({
  cashRegisterApi: {
    getAll: apiMocks.getAll,
    getById: apiMocks.getById,
    create: apiMocks.create,
    update: apiMocks.update,
  },
  storeApi: {
    getAll: apiMocks.storesGetAll,
  },
}));

function renderModal(props = {}) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={qc}>
      <CashRegisterFormModal open onClose={vi.fn()} onSaved={vi.fn()} {...props} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  apiMocks.storesGetAll.mockResolvedValue({ data: [{ id: 1, name: 'MIRONKUL AGRO GLOBAL' }] });
  apiMocks.getAll.mockResolvedValue({ data: { content: [] } });
  apiMocks.create.mockResolvedValue({ data: { id: 99 } });
  apiMocks.update.mockResolvedValue({ data: { id: 152 } });
});

afterEach(() => cleanup());

describe('CashRegisterFormModal fiscal module uniqueness', () => {
  it('blocks saving and shows occupied register details when fiscalCardId belongs to another register', async () => {
    apiMocks.getAll.mockResolvedValue({
      data: {
        content: [
          {
            id: 152,
            registerNumber: 67,
            storeName: 'MIRONKUL AGRO GLOBAL',
            fiscalCardId: 'TEST-FM-001',
          },
        ],
      },
    });

    const { getByRole, getByText, container } = renderModal();

    await waitFor(() => {
      expect(getByRole('button', { name: /Выберите магазин/i })).toBeTruthy();
    });

    fireEvent.click(getByRole('button', { name: /Выберите магазин/i }));
    fireEvent.mouseDown(getByRole('option', { name: 'MIRONKUL AGRO GLOBAL' }));

    const fiscalInput = container.querySelector('input[name="fiscalCardId"]');
    fireEvent.change(fiscalInput, { target: { value: ' test-fm-001 ', name: 'fiscalCardId' } });

    await waitFor(() => {
      const alert = getByRole('alert');
      expect(alert.textContent).toContain('№67');
      expect(alert.textContent).toContain('MIRONKUL AGRO GLOBAL');
    });

    const saveBtn = getByText('Сохранить');
    expect(saveBtn.disabled).toBe(true);
    expect(apiMocks.create).not.toHaveBeenCalled();
  });

  it('allows saving existing register with its own fiscalCardId', async () => {
    apiMocks.getById.mockResolvedValue({
      data: {
        id: 152,
        storeId: 1,
        registerNumber: 67,
        fiscalCardId: 'TEST-FM-001',
      },
    });
    apiMocks.getAll.mockResolvedValue({
      data: {
        content: [
          {
            id: 152,
            registerNumber: 67,
            storeName: 'MIRONKUL AGRO GLOBAL',
            fiscalCardId: 'TEST-FM-001',
          },
        ],
      },
    });

    const { getByText, queryByRole } = renderModal({ registerId: 152 });

    await waitFor(() => {
      expect(getByText('Сохранить').disabled).toBe(false);
    });

    expect(queryByRole('alert')).toBeNull();
    fireEvent.click(getByText('Сохранить'));

    await waitFor(() => {
      expect(apiMocks.update).toHaveBeenCalledWith(
        152,
        expect.objectContaining({ fiscalCardId: 'TEST-FM-001' })
      );
    });
  });

  it('displays server 409 conflict message inline under fiscalCardId', async () => {
    apiMocks.create.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'CONFLICT',
          message: 'Фискальный модуль «TEST-FM-001» уже привязан к кассе №2 (Магазин: Центр)',
        },
      },
    });

    const { getByRole, getByText, container } = renderModal();

    await waitFor(() => {
      expect(getByRole('button', { name: /Выберите магазин/i })).toBeTruthy();
    });

    fireEvent.click(getByRole('button', { name: /Выберите магазин/i }));
    fireEvent.mouseDown(getByRole('option', { name: 'MIRONKUL AGRO GLOBAL' }));

    const fiscalInput = container.querySelector('input[name="fiscalCardId"]');
    fireEvent.change(fiscalInput, { target: { value: 'TEST-FM-001', name: 'fiscalCardId' } });

    fireEvent.click(getByText('Сохранить'));

    await waitFor(() => {
      expect(getByRole('alert').textContent).toContain('кассе №2');
    });
  });
});
