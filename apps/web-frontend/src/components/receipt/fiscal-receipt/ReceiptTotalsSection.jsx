import React from 'react';
import { fmtMoneyCompact } from '../../../utils/fiscalReceiptFormat';
import { ReceiptDivider, ReceiptRow } from './receiptPrimitives';

/** Скидки, итог и НДС чека. */
export default function ReceiptTotalsSection({ sale, vatRateLabel, isOn, t }) {
  const isVisible = isOn('discounts') || isOn('grandTotal') || isOn('vatTotal');
  if (!isVisible) return null;

  const hasOrderDiscountPercent = Number(sale.orderDiscountPercent ?? 0) > 0;

  return (
    <>
      <ReceiptDivider />
      <section className="receipt-section space-y-0.5">
        {isOn('discounts') && Number(sale.lineDiscountTotal ?? 0) > 0 ? (
          <ReceiptRow
            label={t('fiscalReceipt.lineDiscountsSum')}
            value={fmtMoneyCompact(sale.lineDiscountTotal)}
          />
        ) : null}
        {isOn('discounts') && Number(sale.orderDiscountAmount ?? 0) > 0 ? (
          <ReceiptRow
            label={
              hasOrderDiscountPercent
                ? t('fiscalReceipt.orderDiscountPercent', { percent: sale.orderDiscountPercent })
                : t('fiscalReceipt.orderDiscountSum')
            }
            value={fmtMoneyCompact(sale.orderDiscountAmount)}
          />
        ) : null}
        {isOn('discounts') && Number(sale.discountTotal) > 0 ? (
          <ReceiptRow
            label={t('fiscalReceipt.discountsSum')}
            value={fmtMoneyCompact(sale.discountTotal)}
            bold
          />
        ) : null}
        {isOn('grandTotal') ? (
          <ReceiptRow
            label={t('fiscalReceipt.grandTotal')}
            value={fmtMoneyCompact(sale.totalAmount)}
            bold
          />
        ) : null}
        {isOn('vatTotal') ? (
          <ReceiptRow
            label={t('fiscalReceipt.vatTotalLine', { rate: vatRateLabel })}
            value={fmtMoneyCompact(sale.taxTotal)}
            bold
          />
        ) : null}
      </section>
    </>
  );
}
