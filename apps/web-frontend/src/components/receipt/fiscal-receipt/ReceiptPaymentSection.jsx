import React from 'react';
import { formatCardNumberForReceipt } from '@aurent/shared-fiscal';
import { fmtMoneyCompact } from '../../../utils/fiscalReceiptFormat';
import { ReceiptDivider, ReceiptRow } from './receiptPrimitives';

const PAYMENT_I18N = {
  CASH: 'sales.paymentCash',
  CARD: 'sales.paymentCard',
  CASHLESS: 'sales.paymentCashless',
  MPESA: 'sales.paymentMpesa',
  MIXED: 'salesLedger.filters.mixed',
};
const DEFAULT_PAYMENT_I18N = 'sales.paymentCash';

/** Форма оплаты: наличные, пластик, реквизиты карты, сдача. */
export default function ReceiptPaymentSection({ payment, isOn, t }) {
  if (!isOn('payment')) return null;

  const {
    cashAmt,
    cardAmt,
    qrAmt,
    paidTotal,
    change,
    method,
    total,
    cardDetails,
    hasCardPayment,
    isSocialCategory,
    cardProviderText,
    cardCategoryText,
  } = payment;

  const rawCardNum = cardDetails?.socialCardNumber || payment?.cardNumber;
  const formattedCardNumber = formatCardNumberForReceipt(rawCardNum);
  const cardTypeDisplay = cardProviderText || cardCategoryText;

  const hasAnyExplicitMethod =
    Number(cashAmt) > 0 || Number(cardAmt) > 0 || Number(qrAmt) > 0;

  return (
    <>
      <ReceiptDivider dotted />
      <section className="receipt-section space-y-0.5">
        <p className="font-semibold text-xs text-black">{t('fiscalReceipt.paymentForm')}:</p>
        {Number(cashAmt) > 0 ? (
          <ReceiptRow label={t('fiscalReceipt.cash')} value={fmtMoneyCompact(cashAmt)} />
        ) : null}
        {Number(cardAmt) > 0 ? (
          <ReceiptRow label={t('fiscalReceipt.plastic')} value={fmtMoneyCompact(cardAmt)} />
        ) : null}
        {Number(qrAmt) > 0 ? (
          <ReceiptRow
            label={t('fiscalReceipt.qrPayment', { defaultValue: 'QR-kodli to‘lov' })}
            value={fmtMoneyCompact(qrAmt)}
          />
        ) : null}
        {!hasAnyExplicitMethod ? (
          <ReceiptRow
            label={t(PAYMENT_I18N[method] ?? DEFAULT_PAYMENT_I18N)}
            value={fmtMoneyCompact(paidTotal || total)}
          />
        ) : null}
        {hasCardPayment && cardTypeDisplay ? (
          <ReceiptRow label={t('fiscalReceipt.cardType')} value={cardTypeDisplay} />
        ) : null}
        {hasCardPayment && formattedCardNumber ? (
          <ReceiptRow
            label={isSocialCategory ? t('fiscalReceipt.socialCardNumber') : t('fiscalReceipt.cardNumber', { defaultValue: 'Karta raqami' })}
            value={formattedCardNumber}
          />
        ) : null}
        {hasCardPayment && cardDetails.rrn ? (
          <ReceiptRow label={t('fiscalReceipt.cardRrn')} value={cardDetails.rrn} />
        ) : null}
        {change > 0 ? (
          <ReceiptRow label={t('receipt.change')} value={fmtMoneyCompact(change)} bold />
        ) : null}
      </section>
    </>
  );
}
