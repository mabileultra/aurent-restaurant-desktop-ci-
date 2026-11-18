import React from 'react';
import { getLicenseNumber, getReceiptVersionRows } from '@aurent/shared-fiscal';
import { ReceiptDivider, ReceiptRow } from './receiptPrimitives';

const EMPTY_FISCAL_SIGN = '—';

/** Фискальные реквизиты: номер чека, ФМ, версия ПО / десктопа, лицензия, виртуальная касса, фискальный признак. */
export default function ReceiptFiscalSection({ fiscalMeta, isOn, t }) {
  if (!isOn('fiscalBlock')) return null;

  const { fiscalReceiptNo, fmNumber, virtualRegister, fiscalSign } = fiscalMeta;
  const { appVersion, desktopVersion } = getReceiptVersionRows({
    appVersion: fiscalMeta?.appVersion,
    desktopVersion: fiscalMeta?.desktopVersion,
  });
  const licenseNumber = getLicenseNumber(fiscalMeta?.licenseNumber);

  return (
    <>
      <ReceiptDivider dotted />
      <section className="receipt-section space-y-1">
        <p className="receipt-section-title">{t('fiscalReceipt.fiscalSection')}</p>
        {virtualRegister ? (
          <ReceiptRow label={t('fiscalReceipt.virtualRegister')} value={virtualRegister} />
        ) : null}
        {fmNumber ? <ReceiptRow label={t('fiscalReceipt.fmNumber')} value={fmNumber} /> : null}
        {fiscalReceiptNo ? (
          <ReceiptRow label={t('fiscalReceipt.fiscalReceiptNo')} value={fiscalReceiptNo} />
        ) : null}
        {appVersion ? (
          <ReceiptRow label={t('fiscalReceipt.appVersion')} value={appVersion} nowrap />
        ) : null}
        {desktopVersion ? (
          <ReceiptRow label={t('fiscalReceipt.desktopVersion')} value={desktopVersion} nowrap />
        ) : null}
        {licenseNumber ? (
          <ReceiptRow label={t('fiscalReceipt.licenseNumber')} value={licenseNumber} nowrap />
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
