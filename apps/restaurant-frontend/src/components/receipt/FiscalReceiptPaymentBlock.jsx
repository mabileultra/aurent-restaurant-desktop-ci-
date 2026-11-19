import React from 'react';
import { formatCardNumberForReceipt } from '@aurent/shared-fiscal';
import { fmtMoneyCompact } from '../../utils/fiscalReceiptFormat';
import { FiscalReceiptRow } from './FiscalReceiptRow';
import { PAYMENT_I18N } from './fiscalReceiptLineHelpers';

export default function FiscalReceiptPaymentBlock({
  isOn,
  fs,
  t,
  paidTotal,
  total,
  cashAmt,
  cardAmt,
  qrAmt = 0,
  cardTypeText,
  cardCategoryText = null,
  socialCardNumber = null,
  cardNumber = null,
  rrn = null,
  method,
  change,
}) {
  if (!isOn('payment')) return null;
  const payLabel = (m) => t(PAYMENT_I18N[m] ?? 'sales.paymentCash');
  const hasCardPayment = Number(cardAmt) > 0;
  const rawCard = socialCardNumber;
  const formattedCard = formatCardNumberForReceipt(rawCard);
  const cardTypeDisplay = cardCategoryText;
  const hasAnyExplicitMethod = Number(cashAmt) > 0 || Number(cardAmt) > 0 || Number(qrAmt) > 0;

  return (
    <>
      <div className="receipt-divider my-2 border-t border-dotted border-black" />
      <section {...fs('payment', 'receipt-section space-y-0.5')}>
        <p className="font-semibold text-xs text-black">{t('fiscalReceipt.paymentForm')}:</p>
        {Number(cashAmt) > 0 ? (
          <FiscalReceiptRow label={t('fiscalReceipt.cash')} value={fmtMoneyCompact(cashAmt)} />
        ) : null}
        {Number(cardAmt) > 0 ? (
          <FiscalReceiptRow
            label={cardTypeText ? `${t('fiscalReceipt.plastic')} (${cardTypeText})` : t('fiscalReceipt.plastic')}
            value={fmtMoneyCompact(cardAmt)}
          />
        ) : null}
        {Number(qrAmt) > 0 ? (
          <FiscalReceiptRow
            label={t('fiscalReceipt.qrPayment', { defaultValue: 'QR-kodli to‘lov' })}
            value={fmtMoneyCompact(qrAmt)}
          />
        ) : null}
        {!hasAnyExplicitMethod ? (
          <FiscalReceiptRow label={payLabel(method)} value={fmtMoneyCompact(paidTotal || total)} />
        ) : null}
        {hasCardPayment && cardTypeDisplay ? (
          <FiscalReceiptRow label={t('fiscalReceipt.cardType')} value={cardTypeDisplay} />
        ) : null}
        {hasCardPayment && socialCardNumber && formattedCard ? (
          <FiscalReceiptRow
            label={t('fiscalReceipt.cardNumber', { defaultValue: 'Karta raqami' })}
            value={formattedCard}
          />
        ) : null}
        {hasCardPayment && rrn ? (
          <FiscalReceiptRow label={t('fiscalReceipt.cardRrn')} value={rrn} />
        ) : null}
        {change > 0 ? (
          <FiscalReceiptRow label={t('receipt.change')} value={fmtMoneyCompact(change)} bold />
        ) : null}
      </section>
    </>
  );
}
