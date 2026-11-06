import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Printer, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { saleApi, pharmacySalesApi } from '../../../../services/api';
import { FiscalReceiptBody } from '../../../../components/receipt';
import ThermalReportPrintPortal from '../../../../components/shared/ThermalReportPrintPortal';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../../services/cashierEscpos';

export default function CashierSalesReceiptPane({
  catalogKind,
  receiptNumber,
  selectedRow,
  returnDisabled,
  onReturn,
  onClose,
  t,
}) {
  const [printToken, setPrintToken] = useState(null);
  const [printing, setPrinting] = useState(false);

  const listedSale = selectedRow?.id ? selectedRow : null;
  const {
    data: fetchedSale,
    isPending,
  } = useQuery({
    queryKey: ['receipt', catalogKind, selectedRow?.id, receiptNumber],
    queryFn: async () => {
      const client = catalogKind === 'pharmacy' ? pharmacySalesApi : saleApi;
      if (selectedRow?.id) {
        const byId = await client.getById(selectedRow.id);
        return byId.data;
      }
      return client.getReceipt(receiptNumber).then((r) => r.data);
    },
    enabled: Boolean(selectedRow?.id || receiptNumber),
  });
  const sale = fetchedSale || listedSale;

  const canReturn = selectedRow && selectedRow.status !== 'VOIDED';
  const canPrint = Boolean(sale && receiptNumber);

  const handlePrint = async () => {
    if (!canPrint || printing || !sale) return;
    setPrinting(true);

    if (isCashierEscposPrintAvailable()) {
      try {
        await printFiscalReceipt({ sale, t });
        toast.success(t('receipt.printSent'), { id: 'cashier-sales-print' });
      } catch (err) {
        toast.error(resolveEscposPrintErrorMessage(err, t), { id: 'cashier-sales-print' });
      } finally {
        setPrinting(false);
      }
      return;
    }

    setPrintToken(Date.now());
  };

  return (
    <aside className="cashier-sales-receipt-pane" aria-label={t('pos.receipt')}>
      <header className="cashier-sales-receipt-pane__head">
        <button
          type="button"
          className="cashier-sales-receipt-pane__close"
          onClick={onClose}
          aria-label={t('pos.salesBackToList')}
        >
          <ChevronLeft size={18} aria-hidden />
          <span>{t('pos.salesBackToList')}</span>
        </button>
        <button
          type="button"
          className="cashier-sales-receipt-pane__close-icon"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <X size={18} aria-hidden />
        </button>
      </header>
      <div className="cashier-sales-receipt-pane__body">
        {!receiptNumber ? (
          <p className="cashier-sales-receipt-pane__placeholder">{t('pos.salesSelectHint')}</p>
        ) : !sale && isPending ? (
          <p className="cashier-sales-receipt-pane__placeholder">{t('receipt.loading')}</p>
        ) : !sale ? (
          <p className="cashier-sales-receipt-pane__placeholder">{t('receipt.notFound')}</p>
        ) : (
          <div className="cashier-sales-receipt-pane__paper">
            <div className="receipt-page__card cashier-sales-receipt-pane__card">
              <FiscalReceiptBody sale={sale} />
            </div>
          </div>
        )}
      </div>
      {canPrint ? (
        <footer className="cashier-sales-receipt-pane__footer">
          <div className="cashier-sales-receipt-pane__actions">
            <button
              type="button"
              className="cashier-sales-receipt-pane__print"
              onClick={handlePrint}
              disabled={printing}
            >
              <Printer size={18} aria-hidden />
              {printing ? t('common.loading') : t('receipt.print')}
            </button>
            {canReturn ? (
              <button
                type="button"
                className="cashier-sales-receipt-pane__return"
                onClick={onReturn}
                disabled={returnDisabled}
              >
                {t('pos.return')}
              </button>
            ) : null}
          </div>
        </footer>
      ) : null}
      {printToken != null && sale ? (
        <ThermalReportPrintPortal
          open
          printToken={printToken}
          receiptNumber={receiptNumber}
          sale={sale}
          onPrinted={() => {
            toast.success(t('receipt.printSent'), { id: 'cashier-sales-print' });
            setPrintToken(null);
            setPrinting(false);
          }}
          onError={() => {
            toast.error(t('receipt.printFailed'), { id: 'cashier-sales-print' });
            setPrintToken(null);
            setPrinting(false);
          }}
          onClose={() => {
            setPrintToken(null);
            setPrinting(false);
          }}
        >
          <FiscalReceiptBody sale={sale} />
        </ThermalReportPrintPortal>
      ) : null}
    </aside>
  );
}
