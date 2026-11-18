// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import {
  fetchDesktopHardwareSettings,
  executeEscposTestPrint,
  executeDesktopUpdateCheck,
  executeDesktopUiReload,
} from './cashierDesktopMenuHelpers';
import * as escposModule from '../../../services/cashierEscpos';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('cashierDesktopMenuHelpers', () => {
  const mockT = (key, params) => `${key}${params ? `:${JSON.stringify(params)}` : ''}`;

  beforeEach(() => {
    vi.clearAllMocks();
    delete window.desktopCashier;
  });

  describe('fetchDesktopHardwareSettings', () => {
    it('returns empty strings if not desktop cashier', async () => {
      const res = await fetchDesktopHardwareSettings();
      expect(res).toEqual({
        receiptPrinterName: '',
        labelPrinterName: '',
        scalePort: '',
      });
    });

    it('fetches settings when desktopCashier is present', async () => {
      window.desktopCashier = {
        isDesktop: true,
        getPrinterSettings: vi.fn().mockResolvedValue({
          receiptPrinterName: 'Receipt58',
          labelPrinterName: 'Xprinter',
        }),
        scaleGetSettings: vi.fn().mockResolvedValue({ port: 'COM3' }),
      };
      const res = await fetchDesktopHardwareSettings();
      expect(res).toEqual({
        receiptPrinterName: 'Receipt58',
        labelPrinterName: 'Xprinter',
        scalePort: 'COM3',
      });
    });
  });

  describe('executeEscposTestPrint', () => {
    it('shows error if ESC/POS is not available', async () => {
      vi.spyOn(escposModule, 'isCashierEscposPrintAvailable').mockReturnValue(false);
      await executeEscposTestPrint(mockT);
      expect(toast.error).toHaveBeenCalledWith('desktop.testReceiptFailed');
    });

    it('calls printFiscalReceipt and toasts success if available', async () => {
      vi.spyOn(escposModule, 'isCashierEscposPrintAvailable').mockReturnValue(true);
      vi.spyOn(escposModule, 'printFiscalReceipt').mockResolvedValue(true);
      await executeEscposTestPrint(mockT);
      expect(toast.success).toHaveBeenCalledWith('desktop.testReceiptSent', expect.any(Object));
    });
  });

  describe('executeDesktopUpdateCheck', () => {
    it('handles available update', async () => {
      window.desktopCashier = {
        checkForUpdates: vi.fn().mockResolvedValue({ updateAvailable: true, version: '2.0.0' }),
      };
      await executeDesktopUpdateCheck(mockT);
      expect(toast.success).toHaveBeenCalledWith('desktop.checkUpdatesAvailable:{"version":"2.0.0"}');
    });

    it('handles already latest version', async () => {
      window.desktopCashier = {
        checkForUpdates: vi.fn().mockResolvedValue({ ok: true, updateAvailable: false }),
      };
      await executeDesktopUpdateCheck(mockT);
      expect(toast.success).toHaveBeenCalledWith('desktop.checkUpdatesLatest');
    });
  });

  describe('executeDesktopUiReload', () => {
    it('does nothing if already reloadingUi is true', () => {
      const setReloadingUi = vi.fn();
      executeDesktopUiReload({ t: mockT, setReloadingUi, reloadingUi: true });
      expect(setReloadingUi).not.toHaveBeenCalled();
    });

    it('triggers desktop reload if online', async () => {
      const reloadMock = vi.fn().mockResolvedValue({ ok: true });
      window.desktopCashier = { reload: reloadMock };
      const setReloadingUi = vi.fn();
      executeDesktopUiReload({ t: mockT, setReloadingUi, reloadingUi: false });
      expect(setReloadingUi).toHaveBeenCalledWith(true);
      expect(reloadMock).toHaveBeenCalled();
    });
  });
});
