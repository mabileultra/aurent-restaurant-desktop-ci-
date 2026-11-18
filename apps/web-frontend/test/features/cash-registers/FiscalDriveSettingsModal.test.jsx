// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

globalThis.React = React;
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FiscalDriveSettingsModal from '../../../src/features/cash-registers/components/FiscalDriveSettingsModal';

const mocks = vi.hoisted(() => ({
  getAdminSettings: vi.fn(),
  saveAdminSettings: vi.fn(),
  listFiscalDrives: vi.fn(),
  getFiscalDriveInfo: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

const tStable = (key) => {
  if (key === 'common.save') return 'Сохранить';
  if (key === 'common.cancel') return 'Отмена';
  return key;
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tStable }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

vi.mock('../../../src/api/fiscalDrive.api', () => ({
  fiscalDriveApi: {
    getAdminSettings: mocks.getAdminSettings,
    saveAdminSettings: mocks.saveAdminSettings,
  },
}));

vi.mock('../../../src/services/fiscal/providers/fiscalDrive', () => ({
  FISCAL_DRIVE_DEFAULT_BASE_URL: 'http://127.0.0.1:3449',
  listFiscalDrives: mocks.listFiscalDrives,
  getFiscalDriveInfo: mocks.getFiscalDriveInfo,
  parseFiscalDriveFactoryIds: () => [],
  summarizeFiscalDriveInfo: () => ({ terminalId: '', version: '' }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAdminSettings.mockResolvedValue({
    data: {
      cashRegisterId: 155,
      baseUrl: 'http://127.0.0.1:3449',
      factoryId: '0020240830001',
      terminalId: 'ZZ000000000001',
      ownerTin: '123456789',
      useForFiscalization: true,
    },
  });
});

afterEach(() => cleanup());

describe('FiscalDriveSettingsModal server conflict error', () => {
  it('shows inline alert on 409 conflict and clears it when field changes', async () => {
    mocks.saveAdminSettings.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'CONFLICT',
          message: 'Фискальный модуль «0020240830001» уже привязан к кассе №1 (Магазин: «Центральный»)',
        },
      },
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { getByText, getByRole, queryByRole } = render(
      <QueryClientProvider client={qc}>
        <FiscalDriveSettingsModal open cashRegisterId={155} onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(getByText('Сохранить')).toBeTruthy();
    });

    fireEvent.click(getByText('Сохранить'));

    await waitFor(() => {
      expect(getByRole('alert').textContent).toContain('кассе №1');
    });
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Фискальный модуль «0020240830001» уже привязан к кассе №1 (Магазин: «Центральный»)',
    );

    const inputs = document.querySelectorAll('.multikassa-settings__input');
    fireEvent.change(inputs[1], { target: { value: '0020240830999' } });

    await waitFor(() => {
      expect(queryByRole('alert')).toBeNull();
    });
  });

  it('submits trimmed settings and closes modal on success', async () => {
    const onClose = vi.fn();
    mocks.saveAdminSettings.mockResolvedValue({
      data: {
        cashRegisterId: 155,
        baseUrl: 'http://127.0.0.1:3449',
        factoryId: '0020240830999',
        terminalId: 'ZZ000000000001',
        ownerTin: '123456789',
        useForFiscalization: true,
      },
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { getByText } = render(
      <QueryClientProvider client={qc}>
        <FiscalDriveSettingsModal open cashRegisterId={155} onClose={onClose} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(getByText('Сохранить')).toBeTruthy();
    });

    const inputs = document.querySelectorAll('.multikassa-settings__input');
    fireEvent.change(inputs[1], { target: { value: ' 0020240830999 ' } });
    fireEvent.click(getByText('Сохранить'));

    await waitFor(() => {
      expect(mocks.saveAdminSettings).toHaveBeenCalledWith(155, {
        baseUrl: 'http://127.0.0.1:3449',
        factoryId: '0020240830999',
        terminalId: 'ZZ000000000001',
        ownerTin: '123456789',
        useForFiscalization: true,
      });
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('cashRegisters.fiscalDrive.saved');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
