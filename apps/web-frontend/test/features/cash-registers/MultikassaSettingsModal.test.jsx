// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

globalThis.React = React;
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MultikassaSettingsModal from '../../../src/features/cash-registers/components/MultikassaSettingsModal';

const mocks = vi.hoisted(() => ({
  getAdminSettings: vi.fn(),
  saveAdminSettings: vi.fn(),
  getFiscalDrivesWithFallback: vi.fn(),
  getPrintersWithFallback: vi.fn(),
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

vi.mock('../../../src/api/multikassa.api', () => ({
  multikassaApi: {
    getAdminSettings: mocks.getAdminSettings,
    saveAdminSettings: mocks.saveAdminSettings,
  },
}));

vi.mock('../../../src/services/multikassa', () => ({
  MULTIKASSA_BASE_URL_PRESETS: {
    local8080: 'http://localhost:8080',
    local12346: 'http://localhost:12346',
    cloudV3: 'https://v3.mkfiscal.uz',
    cloudV4: 'https://v4.mkfiscal.uz',
  },
  MULTIKASSA_DEFAULT_BASE_URL: 'http://localhost:8080',
  getContragents: vi.fn(),
  getFiscalDrivesWithFallback: mocks.getFiscalDrivesWithFallback,
  ensureMkFiscalPrinter: vi.fn(),
  getPrintersWithFallback: mocks.getPrintersWithFallback,
  normalizeGnkTerminalId: (v) => String(v ?? '').trim().toUpperCase(),
  parseMkFiscalPrinters: () => ({ labels: [], silentSelected: false, selected: '' }),
  selectFiscalDrive: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAdminSettings.mockResolvedValue({
    data: {
      enabled: true,
      baseUrl: 'http://localhost:8080',
      terminalId: 'YZ231006044579',
      moduleNumber: 'YZ231006044579',
      selectedDriveId: 'YZ231006044579',
      printFiscalQr: true,
      requireBeforeSale: false,
    },
  });
  mocks.getFiscalDrivesWithFallback.mockResolvedValue({ data: { drives: [] } });
  mocks.getPrintersWithFallback.mockResolvedValue({ data: [] });
});

afterEach(() => cleanup());

describe('MultikassaSettingsModal server conflict error', () => {
  it('shows inline alert on save error and clears it when input changes', async () => {
    mocks.saveAdminSettings.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'CONFLICT',
          message: 'Фискальный модуль «YZ231006044579» уже привязан к кассе №1 (MIRONKUL AGRO GLOBAL)',
        },
      },
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { getByText, getByRole, queryByRole } = render(
      <QueryClientProvider client={qc}>
        <MultikassaSettingsModal open cashRegisterId={155} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('Сохранить')).toBeTruthy();
    });

    fireEvent.click(getByText('Сохранить'));

    await waitFor(() => {
      expect(getByRole('alert').textContent).toContain('кассе №1');
    });

    const inputs = document.querySelectorAll('.multikassa-settings__input');
    fireEvent.change(inputs[1], { target: { value: 'YZ999999999999' } });

    await waitFor(() => {
      expect(queryByRole('alert')).toBeNull();
    });
  });
});
