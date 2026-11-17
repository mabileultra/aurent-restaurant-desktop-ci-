import React from 'react';
import { getReceiptTranslator } from '../../utils/receiptI18n';
import ReceiptFiscalSection from './fiscal-receipt/ReceiptFiscalSection';
import ReceiptFooterSection from './fiscal-receipt/ReceiptFooterSection';
import ReceiptHeaderSection from './fiscal-receipt/ReceiptHeaderSection';
import ReceiptItemsSection from './fiscal-receipt/ReceiptItemsSection';
import ReceiptMetaSection from './fiscal-receipt/ReceiptMetaSection';
import ReceiptPaymentSection from './fiscal-receipt/ReceiptPaymentSection';
import ReceiptTotalsSection from './fiscal-receipt/ReceiptTotalsSection';
import { ReceiptRow } from './fiscal-receipt/receiptPrimitives';
import { useFiscalReceiptView } from './fiscal-receipt/useFiscalReceiptView';

/**
 * Фискальный чек (экран и window.print). Данные собирает useFiscalReceiptView,
 * разметка каждой секции — в fiscal-receipt/. Порядок секций = порядок на бумаге.
 */
export default function FiscalReceiptBody({ sale, printAreaId = 'receipt-print-area', className = '' }) {
  const t = getReceiptTranslator();
  const view = useFiscalReceiptView(sale, t);

  if (!view) return null;

  const { isOn } = view;

  return (
    <div
      id={printAreaId}
      className={`receipt-print-root min-w-0 max-w-full overflow-hidden ${className}`}
    >
      <ReceiptHeaderSection branding={view.branding} isOn={isOn} t={t} />
      <ReceiptMetaSection sale={sale} view={view} isOn={isOn} t={t} />
      <ReceiptItemsSection sale={sale} isOn={isOn} t={t} />
      <ReceiptTotalsSection sale={sale} vatRateLabel={view.vatRateLabel} isOn={isOn} t={t} />
      <ReceiptPaymentSection payment={view.payment} isOn={isOn} t={t} />

      {view.prescriptionNumber ? (
        <section className="receipt-section mt-1">
          <ReceiptRow label={t('fiscalReceipt.prescriptionNumber')} value={view.prescriptionNumber} bold />
        </section>
      ) : null}

      {isOn('receiptType') ? (
        <section className="receipt-section mt-1">
          <ReceiptRow label={t('fiscalReceipt.receiptType')} value={view.receiptTypeLabel} bold />
        </section>
      ) : null}

      <ReceiptFiscalSection fiscalMeta={view.fiscalMeta} isOn={isOn} t={t} />
      <ReceiptFooterSection
        qrValue={view.fiscalMeta.qrValue}
        showQrBlock={view.showQrBlock}
        isOn={isOn}
        t={t}
      />
    </div>
  );
}
