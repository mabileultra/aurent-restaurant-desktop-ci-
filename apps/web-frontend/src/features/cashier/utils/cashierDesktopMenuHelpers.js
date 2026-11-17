import toast from 'react-hot-toast';
import { CASHIER_ESCPOS_TOAST } from '../../../config/cashierEscposConfig';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { buildEscposTestSale } from '../../../services/cashierEscpos/mockTestSale';
import { isDesktopCashier } from './isDesktopCashier';

/**
 * Fetches current printer and scale settings from desktopCashier IPC.
 *
 * @returns {Promise<{receiptPrinterName: string, labelPrinterName: string, scalePort: string}>}
 */
export async function fetchDesktopHardwareSettings() {
  if (!isDesktopCashier() || typeof window.desktopCashier?.getPrinterSettings !== 'function') {
    return { receiptPrinterName: '', labelPrinterName: '', scalePort: '' };
  }
  try {
    const s = await window.desktopCashier.getPrinterSettings();
    let port = '';
    if (typeof window.desktopCashier.scaleGetSettings === 'function') {
      const sc = await window.desktopCashier.scaleGetSettings();
      port = sc?.port || '';
    }
    return {
      receiptPrinterName: s?.receiptPrinterName || '',
      labelPrinterName: s?.labelPrinterName || '',
      scalePort: port,
    };
  } catch {
    return { receiptPrinterName: '', labelPrinterName: '', scalePort: '' };
  }
}

/**
 * Executes a test print via ESC/POS driver.
 *
 * @param {Function} t - i18n translation function
 */
export async function executeEscposTestPrint(t) {
  if (!isCashierEscposPrintAvailable()) {
    toast.error(t('desktop.testReceiptFailed'));
    return;
  }
  try {
    await printFiscalReceipt({ sale: buildEscposTestSale(), t });
    toast.success(t('desktop.testReceiptSent'), { id: CASHIER_ESCPOS_TOAST.toastId });
  } catch (e) {
    toast.error(resolveEscposPrintErrorMessage(e, t) ?? t('desktop.testReceiptFailed'), {
      id: CASHIER_ESCPOS_TOAST.toastId,
    });
  }
}

/**
 * Checks for application updates via desktopCashier IPC.
 *
 * @param {Function} t - i18n translation function
 */
export async function executeDesktopUpdateCheck(t) {
  if (typeof window.desktopCashier?.checkForUpdates !== 'function') return;
  try {
    const result = await window.desktopCashier.checkForUpdates();
    if (result?.updateAvailable) {
      toast.success(t('desktop.checkUpdatesAvailable', { version: result.version }));
    } else if (result?.ok && result?.reason !== 'signature') {
      toast.success(t('desktop.checkUpdatesLatest'));
    } else if (result?.reason !== 'dev' && result?.reason !== 'signature') {
      toast.error(t('desktop.checkUpdatesFailed'));
    }
  } catch {
    toast.error(t('desktop.checkUpdatesFailed'));
  }
}

/**
 * Triggers UI reload via desktop IPC with offline guards.
 *
 * @param {object} options - Options containing t and state setters
 */
export function executeDesktopUiReload({ t, setReloadingUi, reloadingUi }) {
  if (reloadingUi) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    toast.error(t('desktop.reloadNeedsInternet'));
    return;
  }
  if (typeof window.desktopCashier?.reload !== 'function') return;
  setReloadingUi(true);
  window.desktopCashier
    .reload()
    .then((result) => {
      if (result?.ok === false && result?.reason === 'offline') {
        setReloadingUi(false);
        toast.error(t('desktop.reloadNeedsInternet'));
      }
    })
    .catch(() => {
      setReloadingUi(false);
      toast.error(t('desktop.reloadNeedsInternet'));
    });
}
