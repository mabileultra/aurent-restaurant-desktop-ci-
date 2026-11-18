import React from 'react';
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

/** Способы оплаты, уже показанные строками «наличные» / «пластик». */
const METHODS_COVERED_BY_CASH_AND_CARD_ROWS = ['CASH', 'MIXED', 'CARD', 'CASHLESS', 'MPESA'];

/** Форма оплаты: наличные, пластик, реквизиты карты, сдача. */
export default function ReceiptPaymentSection({ payment, isOn, t }) {
  if (!isOn('payment')) return null;

  const {
    cashAmt,
    cardAmt,
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
  const plasticLabel = cardProviderText
    ? `${t('fiscalReceipt.plastic')} · ${cardProviderText}`
    : t('fiscalReceipt.plastic');
  const hasOtherMethodRow = !METHODS_COVERED_BY_CASH_AND_CARD_ROWS.includes(method);

  return (
    <>
      <ReceiptDivider dotted />
      <section className="receipt-section space-y-0.5">
        <ReceiptRow label={t('fiscalReceipt.paymentForm')} value={fmtMoneyCompact(paidTotal || total)} />
        <ReceiptRow label={t('fiscalReceipt.cash')} value={fmtMoneyCompact(cashAmt)} />
        <ReceiptRow label={plasticLabel} value={fmtMoneyCompact(cardAmt)} />
        {cardCategoryText ? (
          <ReceiptRow label={t('fiscalReceipt.cardType')} value={cardCategoryText} />
        ) : null}
        {isSocialCategory && cardDetails.socialCardNumber ? (
          <ReceiptRow label={t('fiscalReceipt.socialCardNumber')} value={cardDetails.socialCardNumber} />
        ) : null}
        {hasCardPayment && cardDetails.rrn ? (
          <ReceiptRow label={t('fiscalReceipt.cardRrn')} value={cardDetails.rrn} />
        ) : null}
        {hasOtherMethodRow ? (
          <ReceiptRow
            label={t(PAYMENT_I18N[method] ?? DEFAULT_PAYMENT_I18N)}
            value={fmtMoneyCompact(total)}
          />
        ) : null}
        {change > 0 ? (
          <ReceiptRow label={t('receipt.change')} value={fmtMoneyCompact(change)} bold />
        ) : null}
      </section>
    </>
  );
}
