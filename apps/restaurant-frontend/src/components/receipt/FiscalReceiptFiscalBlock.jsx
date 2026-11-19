import React from 'react';
import { getLicenseNumber, getReceiptVersionRows } from '@aurent/shared-fiscal';
import { FiscalReceiptRow } from './FiscalReceiptRow';

export default function FiscalReceiptFiscalBlock({
  isOn,
  fs,
  t,
  fiscalReceiptNo,
  fmNumber,
  appVersion,
  desktopVersion,
  licenseNumber,
  virtualRegister,
  fiscalSign,
  receiptTypeLabel,
}) {
  const versions = getReceiptVersionRows({ appVersion, desktopVersion });
  const resolvedLicense = getLicenseNumber(licenseNumber);

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
            {virtualRegister ? (
              <FiscalReceiptRow label={t('fiscalReceipt.virtualRegister')} value={virtualRegister} />
            ) : null}
            {fmNumber ? <FiscalReceiptRow label={t('fiscalReceipt.fmNumber')} value={fmNumber} /> : null}
            {fiscalReceiptNo ? (
              <FiscalReceiptRow label={t('fiscalReceipt.fiscalReceiptNo')} value={fiscalReceiptNo} />
            ) : null}
            {versions.appVersion ? (
              <FiscalReceiptRow label={t('fiscalReceipt.appVersion')} value={versions.appVersion} nowrap />
            ) : null}
            {versions.desktopVersion ? (
              <FiscalReceiptRow label={t('fiscalReceipt.desktopVersion')} value={versions.desktopVersion} nowrap />
            ) : null}
            {resolvedLicense ? (
              <FiscalReceiptRow label={t('fiscalReceipt.licenseNumber')} value={resolvedLicense} nowrap />
            ) : null}
            <div className="receipt-row">
              <span className="receipt-meta-label">{t('fiscalReceipt.fiscalSign')}</span>
              <span className={fiscalSign ? 'receipt-fiscal-sign receipt-row__value' : 'receipt-row__value'}>{fiscalSign || '—'}</span>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
