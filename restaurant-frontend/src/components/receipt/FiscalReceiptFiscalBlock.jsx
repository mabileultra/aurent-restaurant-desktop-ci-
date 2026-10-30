import { FiscalReceiptRow } from './FiscalReceiptRow';

export default function FiscalReceiptFiscalBlock({
  isOn,
  fs,
  t,
  fiscalReceiptNo,
  fmNumber,
  virtualRegister,
  fiscalSign,
  receiptTypeLabel,
}) {
  return (
    <>
      {isOn('receiptType') ? (
        <section {...fs('receiptType', 'receipt-section mt-1')}>
          <FiscalReceiptRow label={t('fiscalReceipt.receiptType')} value={receiptTypeLabel} bold />
        </section>
      ) : null}

      {isOn('fiscalBlock') ? (
        <>
          <div className="receipt-divider my-2 border-t border-dotted border-black" />
          <section {...fs('fiscalBlock', 'receipt-section space-y-1')}>
            <p className="receipt-section-title">{t('fiscalReceipt.fiscalSection')}</p>
            {fiscalReceiptNo ? (
              <FiscalReceiptRow label={t('fiscalReceipt.fiscalReceiptNo')} value={fiscalReceiptNo} />
            ) : null}
            {fmNumber ? <FiscalReceiptRow label={t('fiscalReceipt.fmNumber')} value={fmNumber} /> : null}
            {virtualRegister ? (
              <FiscalReceiptRow label={t('fiscalReceipt.virtualRegister')} value={virtualRegister} />
            ) : null}
            <div className="receipt-row">
              <span className="receipt-meta-label">{t('fiscalReceipt.fiscalSign')}</span>
              <span className="receipt-fiscal-sign receipt-row__value">{fiscalSign || '—'}</span>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
