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
  cardTypeText,
  cardCategoryText = null,
  socialCardNumber = null,
  rrn = null,
  method,
  change,
}) {
  if (!isOn('payment')) return null;
  const payLabel = (m) => t(PAYMENT_I18N[m] ?? 'sales.paymentCash');

  return (
    <>
      <div className="receipt-divider my-2 border-t border-dotted border-black" />
      <section {...fs('payment', 'receipt-section space-y-0.5')}>
        <FiscalReceiptRow label={t('fiscalReceipt.paymentForm')} value={fmtMoneyCompact(paidTotal || total)} />
        <FiscalReceiptRow label={t('fiscalReceipt.cash')} value={fmtMoneyCompact(cashAmt)} />
        <FiscalReceiptRow
          label={
            cardTypeText
              ? `${t('fiscalReceipt.plastic')} · ${cardTypeText}`
              : t('fiscalReceipt.plastic')
          }
          value={fmtMoneyCompact(cardAmt)}
        />
        {cardCategoryText ? (
          <FiscalReceiptRow label={t('fiscalReceipt.cardType')} value={cardCategoryText} />
        ) : null}
        {socialCardNumber ? (
          <FiscalReceiptRow label={t('fiscalReceipt.socialCardNumber')} value={socialCardNumber} />
        ) : null}
        {rrn ? (
          <FiscalReceiptRow label={t('fiscalReceipt.cardRrn')} value={rrn} />
        ) : null}
        {method !== 'CASH' &&
        method !== 'MIXED' &&
        method !== 'CARD' &&
        method !== 'CASHLESS' &&
        method !== 'MPESA' ? (
          <FiscalReceiptRow label={payLabel(method)} value={fmtMoneyCompact(total)} />
        ) : null}
        {change > 0 ? (
          <FiscalReceiptRow label={t('receipt.change')} value={fmtMoneyCompact(change)} bold />
        ) : null}
      </section>
    </>
  );
}
