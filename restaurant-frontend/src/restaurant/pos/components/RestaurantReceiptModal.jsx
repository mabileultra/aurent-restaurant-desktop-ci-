import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Settings2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { CASHIER_ESCPOS_TOAST } from '../../../config/cashierEscposConfig';
import { FiscalReceiptBody, ThermalPrintSettingsPanel } from '../../../components/receipt';
import { RECEIPT_PRINT_DOM } from '../../../config/receiptPrintConfig';
import {
  printOrdinarySaleReceipt,
  saleNeedsFiscalPrint,
} from '../utils/printOrdinarySaleReceipt';
import '../styles/receipt-modal.css';

async function printSaleReceipt(sale, t) {
  if (saleNeedsFiscalPrint(sale)) {
    return printFiscalReceipt({ sale, t, useModalShell: true });
  }
  return printOrdinarySaleReceipt({ sale, t });
}

export default function RestaurantReceiptModal({
  sale,
  autoPrint = false,
  onClose,
  onRefund,
  refunding = false,
  allowRefund = true,
  t,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const tRef = useRef(t);
  tRef.current = t;

  const handlePrint = async () => {
    if (!sale || printing) return;
    setPrinting(true);
    try {
      await printSaleReceipt(sale, t);
      toast.success(t('receipt.printSent'), {
        id: CASHIER_ESCPOS_TOAST.toastId,
        duration: CASHIER_ESCPOS_TOAST.successDurationMs,
      });
    } catch (e) {
      toast.error(
        (saleNeedsFiscalPrint(sale) && isCashierEscposPrintAvailable()
          ? resolveEscposPrintErrorMessage(e, t)
          : e?.message) ?? t('receipt.printFailed'),
        {
          id: CASHIER_ESCPOS_TOAST.toastId,
          duration: CASHIER_ESCPOS_TOAST.errorDurationMs,
        },
      );
    } finally {
      setPrinting(false);
    }
  };

  useEffect(() => {
    if (!sale || !autoPrint) return undefined;
    let active = true;
    const timer = window.setTimeout(async () => {
      if (!active) return;
      const translate = tRef.current;
      setPrinting(true);
      try {
        await printSaleReceipt(sale, translate);
        if (!active) return;
        toast.success(translate('receipt.printSent'), {
          id: CASHIER_ESCPOS_TOAST.toastId,
          duration: CASHIER_ESCPOS_TOAST.successDurationMs,
        });
      } catch (e) {
        if (!active) return;
        toast.error(
          (saleNeedsFiscalPrint(sale) && isCashierEscposPrintAvailable()
            ? resolveEscposPrintErrorMessage(e, translate)
            : e?.message) ?? translate('receipt.printFailed'),
          {
            id: CASHIER_ESCPOS_TOAST.toastId,
            duration: CASHIER_ESCPOS_TOAST.errorDurationMs,
          },
        );
      } finally {
        if (active) setPrinting(false);
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [sale, autoPrint]);

  if (!sale || typeof document === 'undefined') return null;

  return createPortal(
    <div className="rst-receipt-modal fiscal-print-scene" role="presentation">
      <button
        type="button"
        className="rst-receipt-modal__backdrop print:hidden"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        className="rst-receipt-modal__dialog fiscal-print-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rst-receipt-modal__toolbar print:hidden">
          <div className="rst-receipt-modal__title">
            <strong>{t('rst.order.receiptTitle')}</strong>
            <span>№{sale.receiptNumber}</span>
          </div>
          <div className="rst-receipt-modal__actions">
            <button
              type="button"
              className={`rst-receipt-modal__btn${settingsOpen ? ' is-active' : ''}`}
              onClick={() => setSettingsOpen((o) => !o)}
              aria-expanded={settingsOpen}
            >
              <Settings2 size={15} />
              {t('printSettings.toggleShort')}
            </button>
            <div className="rst-receipt-modal__pay-actions">
              <button
                type="button"
                className="rst-receipt-modal__btn rst-receipt-modal__btn--primary"
                onClick={handlePrint}
                disabled={printing}
              >
                <Printer size={15} />
                {printing ? t('common.loading') : t('receipt.print')}
              </button>
              {allowRefund ? (
                <button
                  type="button"
                  className="rst-receipt-modal__btn rst-receipt-modal__btn--danger"
                  onClick={() => onRefund?.(sale?.id)}
                  disabled={refunding || !onRefund || !sale?.id}
                >
                  {refunding ? t('common.loading') : t('rst.order.refund')}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="rst-receipt-modal__btn rst-receipt-modal__btn--icon"
              onClick={onClose}
              aria-label={t('common.cancel')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {settingsOpen ? (
          <div className="rst-receipt-modal__settings print:hidden">
            <ThermalPrintSettingsPanel compact />
          </div>
        ) : null}

        <div id={RECEIPT_PRINT_DOM.fiscalPrintShellId} className="rst-receipt-modal__body">
          <div className="bg-white text-black">
            <FiscalReceiptBody sale={sale} />
          </div>
        </div>

        <div className="rst-receipt-modal__footer print:hidden">
          <button type="button" className="rst-receipt-modal__btn" onClick={onClose}>
            {t('rst.order.receiptDone')}
          </button>
          <div className="rst-receipt-modal__pay-actions">
            <button
              type="button"
              className="rst-receipt-modal__btn rst-receipt-modal__btn--primary"
              onClick={handlePrint}
              disabled={printing}
            >
              <Printer size={15} />
              {printing ? t('common.loading') : t('receipt.print')}
            </button>
            {allowRefund ? (
              <button
                type="button"
                className="rst-receipt-modal__btn rst-receipt-modal__btn--danger"
                onClick={() => onRefund?.(sale?.id)}
                disabled={refunding || !onRefund || !sale?.id}
              >
                {refunding ? t('common.loading') : t('rst.order.refund')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
