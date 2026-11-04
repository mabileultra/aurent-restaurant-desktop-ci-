import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Printer, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../../services/cashierEscpos';
import { CASHIER_ESCPOS_TOAST } from '../../../../config/cashierEscposConfig';
import RestaurantFiscalReceipt from '../../components/RestaurantFiscalReceipt';
import { loadRestaurantReceiptSale } from '../../utils/loadRestaurantReceiptSale';
import {
  printOrdinarySaleReceipt,
  saleNeedsFiscalPrint,
} from '../../utils/printOrdinarySaleReceipt';
import '../styles/cashier-paid-receipt-pane.css';

export default function CashierPaidReceiptPane({
  orderId,
  storeName,
  waiterNameById,
  returnDisabled = false,
  onReturn,
  onClose,
  allowRefund = true,
  t,
}) {
  const [printing, setPrinting] = useState(false);

  const {
    data: sale,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['rst-receipt-sale', orderId],
    queryFn: () =>
      loadRestaurantReceiptSale({
        orderId,
        storeName,
        waiterNameById,
        t,
      }),
    enabled: Boolean(orderId),
  });

  const canReturn = allowRefund && sale && sale.status !== 'VOIDED' && sale.status !== 'REFUNDED';

  const handlePrint = async () => {
    if (!sale || printing) return;
    setPrinting(true);
    try {
      if (saleNeedsFiscalPrint(sale)) {
        await printFiscalReceipt({ sale, t, useModalShell: false });
      } else {
        await printOrdinarySaleReceipt({ sale, t });
      }
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

  return (
    <aside className="rst-paid-receipt-pane" aria-label={t('pos.receipt')}>
      <header className="rst-paid-receipt-pane__head">
        <button
          type="button"
          className="rst-paid-receipt-pane__back"
          onClick={onClose}
          aria-label={t('pos.salesBackToList')}
        >
          <ChevronLeft size={18} aria-hidden />
          <span>{t('pos.salesBackToList')}</span>
        </button>
        <button
          type="button"
          className="rst-paid-receipt-pane__close"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <X size={18} aria-hidden />
        </button>
      </header>

      <div className="rst-paid-receipt-pane__body">
        {isPending ? (
          <p className="rst-paid-receipt-pane__placeholder">{t('common.loading')}</p>
        ) : isError || !sale ? (
          <p className="rst-paid-receipt-pane__placeholder">{t('rst.cashier.receiptLoadFailed')}</p>
        ) : (
          <div className="rst-paid-receipt-pane__paper">
            <RestaurantFiscalReceipt sale={sale} />
          </div>
        )}
      </div>

      {sale ? (
        <footer className="rst-paid-receipt-pane__footer">
          <button
            type="button"
            className="rst-paid-receipt-pane__print"
            onClick={handlePrint}
            disabled={printing}
          >
            <Printer size={17} aria-hidden />
            {printing ? t('common.loading') : t('receipt.print')}
          </button>
          {canReturn ? (
            <button
              type="button"
              className="rst-paid-receipt-pane__return"
              onClick={() => onReturn?.(sale)}
              disabled={returnDisabled}
            >
              {t('pos.return')}
            </button>
          ) : null}
        </footer>
      ) : null}
    </aside>
  );
}
