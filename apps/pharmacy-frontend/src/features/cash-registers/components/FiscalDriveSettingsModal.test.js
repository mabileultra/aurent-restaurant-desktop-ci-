// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FiscalDriveSettingsModal from './FiscalDriveSettingsModal';

globalThis.React = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

vi.mock('../../../api/fiscalDrive.api', () => ({
  fiscalDriveApi: {
    getAdminSettings: mocks.getAdminSettings,
    saveAdminSettings: mocks.saveAdminSettings,
  },
}));

vi.mock('../../../services/fiscal/providers/fiscalDrive/fiscalDriveHttpClient', () => ({
  FISCAL_DRIVE_DEFAULT_BASE_URL: 'http://127.0.0.1:3449',
  listFiscalDrives: mocks.listFiscalDrives,
  getFiscalDriveInfo: mocks.getFiscalDriveInfo,
  parseFiscalDriveFactoryIds: () => [],
  summarizeFiscalDriveInfo: () => ({ terminalId: '', version: '' }),
}));

let container;
let root;

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
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

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  document.body.innerHTML = '';
});

function setNativeInputValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('FiscalDriveSettingsModal (pharmacy) server conflict error', () => {
  it('shows inline alert on 409 conflict and clears it when field changes', async () => {
    mocks.saveAdminSettings.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'CONFLICT',
          message: 'Фискальный модуль «0020240830001» уже привязан к кассе №1 (Магазин: «Аптека»)',
        },
      },
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    await act(async () => {
      root.render(
        React.createElement(
          QueryClientProvider,
          { client: qc },
          React.createElement(FiscalDriveSettingsModal, {
            open: true,
            cashRegisterId: 155,
            onClose: vi.fn(),
          }),
        ),
      );
    });
    await flush();

    const form = document.body.querySelector('form');
    expect(form).toBeTruthy();

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    const alert = document.body.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('кассе №1');
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Фискальный модуль «0020240830001» уже привязан к кассе №1 (Магазин: «Аптека»)',
    );

    const inputs = document.body.querySelectorAll('.multikassa-settings__input');
    await act(async () => {
      setNativeInputValue(inputs[1], '0020240830999');
    });
    await flush();

    expect(document.body.querySelector('[role="alert"]')).toBeNull();
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

    await act(async () => {
      root.render(
        React.createElement(
          QueryClientProvider,
          { client: qc },
          React.createElement(FiscalDriveSettingsModal, {
            open: true,
            cashRegisterId: 155,
            onClose,
          }),
        ),
      );
    });
    await flush();

    const inputs = document.body.querySelectorAll('.multikassa-settings__input');
    await act(async () => {
      setNativeInputValue(inputs[1], ' 0020240830999 ');
    });
    await flush();

    const form = document.body.querySelector('form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(mocks.saveAdminSettings).toHaveBeenCalledWith(155, {
      baseUrl: 'http://127.0.0.1:3449',
      factoryId: '0020240830999',
      terminalId: 'ZZ000000000001',
      ownerTin: '123456789',
      useForFiscalization: true,
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('cashRegisters.fiscalDrive.saved');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
