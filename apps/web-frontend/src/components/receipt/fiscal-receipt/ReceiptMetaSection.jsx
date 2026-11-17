import React from 'react';
import { ReceiptRow } from './receiptPrimitives';

/** Дата и время, номер чека, кассир, смена. */
export default function ReceiptMetaSection({ sale, view, isOn, t }) {
  const isVisible =
    isOn('dateTime') || isOn('receiptNo') || isOn('employee') || isOn('shift');

  if (!isVisible) return null;

  return (
    <section className="receipt-section mt-2 space-y-0.5">
      {isOn('dateTime') ? (
        <div className="receipt-row receipt-row--datetime">
          <span>
            <span className="receipt-meta-label">{t('fiscalReceipt.time')}: </span>
            {view.time}
          </span>
          <span className="receipt-row__value">
            <span className="receipt-meta-label">{t('fiscalReceipt.date')}: </span>
            {view.date}
          </span>
        </div>
      ) : null}
      {isOn('receiptNo') ? (
        <ReceiptRow label={t('fiscalReceipt.receiptNoShort')} value={`№${sale.receiptNumber}`} />
      ) : null}
      {sale.originalReceiptNumber ? (
        <ReceiptRow
          label={t('fiscalReceipt.originalReceiptNo')}
          value={`№${sale.originalReceiptNumber}`}
        />
      ) : null}
      {isOn('employee') && sale.cashierName ? (
        <ReceiptRow label={t('fiscalReceipt.employee')} value={sale.cashierName} />
      ) : null}
      {isOn('shift') ? <ReceiptRow label={t('fiscalReceipt.shift')} value={view.shiftNo} /> : null}
    </section>
  );
}
