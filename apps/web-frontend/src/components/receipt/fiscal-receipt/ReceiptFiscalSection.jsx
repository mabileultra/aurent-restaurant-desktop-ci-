import React from 'react';
import { ReceiptDivider, ReceiptRow } from './receiptPrimitives';

const EMPTY_FISCAL_SIGN = '—';

/** Фискальные реквизиты: номер чека, ФМ, виртуальная касса, фискальный признак. */
export default function ReceiptFiscalSection({ fiscalMeta, isOn, t }) {
  if (!isOn('fiscalBlock')) return null;

  const { fiscalReceiptNo, fmNumber, virtualRegister, fiscalSign } = fiscalMeta;

  return (
    <>
      <ReceiptDivider dotted />
      <section className="receipt-section space-y-1">
        <p className="receipt-section-title">{t('fiscalReceipt.fiscalSection')}</p>
        {fiscalReceiptNo ? (
          <ReceiptRow label={t('fiscalReceipt.fiscalReceiptNo')} value={fiscalReceiptNo} />
        ) : null}
        {fmNumber ? <ReceiptRow label={t('fiscalReceipt.fmNumber')} value={fmNumber} /> : null}
        {virtualRegister ? (
          <ReceiptRow label={t('fiscalReceipt.virtualRegister')} value={virtualRegister} />
        ) : null}
        <div className="receipt-row">
          <span className="receipt-meta-label">{t('fiscalReceipt.fiscalSign')}</span>
          <span className={fiscalSign ? 'receipt-fiscal-sign receipt-row__value' : 'receipt-row__value'}>
            {fiscalSign || EMPTY_FISCAL_SIGN}
          </span>
        </div>
      </section>
    </>
  );
}
