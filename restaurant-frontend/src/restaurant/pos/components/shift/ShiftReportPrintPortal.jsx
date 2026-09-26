import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RECEIPT_PRINT_DOM } from '../../../../config/receiptPrintConfig';
import {
  isCashierEscposReportPrintAvailable,
  printThermalDocument,
  resolveEscposPrintErrorMessage,
} from '../../../../services/cashierEscpos';
import { printThermalReceiptDialog } from '../../../../utils/printReceipt';
import {
  waitForReceiptDomReady,
  waitForReceiptPaintSettled,
} from '../../../../utils/receiptPrintWait';
import '../../styles/shift-report-print-portal.css';

/**
 * Hidden thermal host + ESC/POS or browser print for X/Z reports.
 */
export default function ShiftReportPrintPortal({
  open,
  printToken,
  shiftReport,
  t,
  children,
  onPrinted,
  onClose,
  onError,
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const onPrintedRef = useRef(onPrinted);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  onPrintedRef.current = onPrinted;
  onCloseRef.current = onClose;
  onErrorRef.current = onError;

  useLayoutEffect(() => {
    if (!open || printToken == null || !shiftReport) {
      setShowOverlay(false);
      return undefined;
    }

    let cancelled = false;
    setShowOverlay(true);

    const run = async () => {
      try {
        await waitForReceiptDomReady({ useModalShell: true });
        await waitForReceiptPaintSettled();
        if (isCashierEscposReportPrintAvailable()) {
          await printThermalDocument({ shiftReport, t, useModalShell: true });
        } else {
          await printThermalReceiptDialog({ useModalShell: true });
        }
        if (!cancelled) {
          onPrintedRef.current?.();
          onCloseRef.current?.();
        }
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current?.(
            new Error(resolveEscposPrintErrorMessage(err, t) || err?.message || t('receipt.printFailed')),
          );
          onCloseRef.current?.();
        }
      } finally {
        if (!cancelled) setShowOverlay(false);
      }
    };

    const timer = window.setTimeout(run, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, printToken, shiftReport, t]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {showOverlay ? (
        <div className="rst-shift-print-overlay" role="status">
          <strong>{t('receipt.printingReportTitle', { defaultValue: 'Печатается отчёт…' })}</strong>
        </div>
      ) : null}
      <div className="fiscal-print-scene rst-shift-print-scene" aria-hidden={!open}>
        <div className={RECEIPT_PRINT_DOM.fiscalPrintDialogClass}>
          <div
            id={RECEIPT_PRINT_DOM.fiscalPrintShellId}
            className="rst-shift-print-host"
          >
            <div
              id={RECEIPT_PRINT_DOM.receiptPrintAreaId}
              className="receipt-print-root rst-shift-report-print-root"
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
