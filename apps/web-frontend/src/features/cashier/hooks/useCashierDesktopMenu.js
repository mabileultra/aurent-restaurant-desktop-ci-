import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { isDesktopCashier } from '../utils/isDesktopCashier';
import {
  fetchDesktopHardwareSettings,
  executeEscposTestPrint,
  executeDesktopUpdateCheck,
  executeDesktopUiReload,
} from '../utils/cashierDesktopMenuHelpers';

export function useCashierDesktopMenu() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [reloadingUi, setReloadingUi] = useState(false);
  const [printerName, setPrinterName] = useState('');
  const [labelPrinterName, setLabelPrinterName] = useState('');
  const [scalePort, setScalePort] = useState('');

  const close = useCallback(() => setOpen(false), []);

  const refreshPrinter = useCallback(async () => {
    const s = await fetchDesktopHardwareSettings();
    setPrinterName(s.receiptPrinterName);
    setLabelPrinterName(s.labelPrinterName);
    setScalePort(s.scalePort);
  }, []);

  useEffect(() => {
    refreshPrinter();
  }, [refreshPrinter]);

  useEffect(() => {
    if (!open) return undefined;
    refreshPrinter();
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        close();
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, refreshPrinter]);

  const run = async (fn) => {
    close();
    try {
      await fn?.();
    } catch {
      /* ignore */
    }
  };

  const toggleFullscreen = () => {
    close();
    try {
      void window.desktopCashier?.toggleFullscreen?.();
    } catch {
      /* ignore */
    }
  };

  const reloadUi = () => executeDesktopUiReload({ t, setReloadingUi, reloadingUi });

  const openPrinterPicker = async () => {
    close();
    try {
      const settings = await window.desktopCashier.openPrinterPicker();
      const next = settings?.receiptPrinterName || '';
      setPrinterName(next);
      setLabelPrinterName(settings?.labelPrinterName || '');
      if (next) toast.success(t('desktop.printerSaved'));
    } catch {
      /* ignore */
    }
  };

  const openLabelPicker = async () => {
    close();
    if (typeof window.desktopCashier?.openLabelPrinterPicker !== 'function') return;
    try {
      const settings = await window.desktopCashier.openLabelPrinterPicker();
      const next = settings?.labelPrinterName || '';
      setLabelPrinterName(next);
      setPrinterName(settings?.receiptPrinterName || '');
      if (next) toast.success(t('desktop.printerSaved'));
    } catch {
      /* ignore */
    }
  };

  const runTestPrint = async () => {
    close();
    await executeEscposTestPrint(t);
  };

  const openScalePicker = async () => {
    close();
    if (typeof window.desktopCashier?.openScalePicker !== 'function') return;
    try {
      const s = await window.desktopCashier.openScalePicker();
      setScalePort(s?.port || '');
      if (s?.port) toast.success(t('desktop.scaleSaved'));
    } catch {
      /* ignore */
    }
  };

  const openBarcodePage = () => {
    close();
    if (typeof window.desktopCashier?.openBarcodePage === 'function') {
      window.desktopCashier.openBarcodePage().catch(() => {});
    }
  };

  const checkAppUpdates = async () => {
    close();
    await executeDesktopUpdateCheck(t);
  };

  useEffect(() => {
    if (!isDesktopCashier()) return undefined;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        if (typeof window.desktopCashier?.openServerSetup === 'function') {
          window.desktopCashier.openServerSetup().catch(() => {});
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const openServerSetup = async () => {
    close();
    if (typeof window.desktopCashier?.openServerSetup !== 'function') return;
    try {
      await window.desktopCashier.openServerSetup();
    } catch {}
  };

  if (!isDesktopCashier()) {
    return null;
  }

  return {
    t,
    rootRef,
    open,
    setOpen,
    close,
    run,
    toggleFullscreen,
    reloadUi,
    reloadingUi,
    printerName,
    labelPrinterName,
    scalePort,
    openPrinterPicker,
    openLabelPicker,
    runTestPrint,
    openScalePicker,
    openBarcodePage,
    checkAppUpdates,
    openServerSetup,
    printerLabel: printerName || t('desktop.receiptPrinterNotSet'),
    labelPrinterLabel: labelPrinterName || t('desktop.receiptPrinterNotSet'),
    scaleLabel: scalePort || t('desktop.scaleNotSet'),
  };
}
