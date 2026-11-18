import React from 'react';
import { getLicenseNumber, getReceiptVersionRows } from '@aurent/shared-fiscal';
import ReceiptQrCode from './ReceiptQrCode';
import { PharmacyReceiptRow as Row } from './PharmacyReceiptItemsAndTotals';

export default function PharmacyReceiptFiscalFooter({
  fiscalMeta,
  prescriptionNumber,
  receiptTypeLabel,
  showQrBlock,
  isOn,
  t,
}) {
  const { fmNumber, virtualRegister, fiscalSign, fiscalReceiptNo, qrValue } = fiscalMeta;
  const { appVersion, desktopVersion } = getReceiptVersionRows({
    appVersion: fiscalMeta.appVersion,
    desktopVersion: fiscalMeta.desktopVersion,
  });
  const licenseNumber = getLicenseNumber(fiscalMeta.licenseNumber);

  return (
    <>
      {prescriptionNumber ? (
        <section className="receipt-section mt-1">
          <Row label={t('fiscalReceipt.prescriptionNumber')} value={prescriptionNumber} bold />
        </section>
      ) : null}

      {isOn('receiptType') ? (
        <section className="receipt-section mt-1">
          <Row label={t('fiscalReceipt.receiptType')} value={receiptTypeLabel} bold />
        </section>
      ) : null}

      {isOn('fiscalBlock') ? (
        <>
          <div className="receipt-divider my-2 border-t border-dotted border-black" />
          <section className="receipt-section space-y-1">
            <p className="receipt-section-title">{t('fiscalReceipt.fiscalSection')}</p>
            {virtualRegister ? <Row label={t('fiscalReceipt.virtualRegister')} value={virtualRegister} /> : null}
            {fmNumber ? <Row label={t('fiscalReceipt.fmNumber')} value={fmNumber} /> : null}
            {fiscalReceiptNo ? <Row label={t('fiscalReceipt.fiscalReceiptNo')} value={fiscalReceiptNo} /> : null}
            {appVersion ? <Row label={t('fiscalReceipt.appVersion')} value={appVersion} nowrap /> : null}
            {desktopVersion ? <Row label={t('fiscalReceipt.desktopVersion')} value={desktopVersion} nowrap /> : null}
            {licenseNumber ? <Row label={t('fiscalReceipt.licenseNumber')} value={licenseNumber} nowrap /> : null}
            <div className="receipt-row">
              <span className="receipt-meta-label">{t('fiscalReceipt.fiscalSign')}</span>
              <span className={fiscalSign ? 'receipt-fiscal-sign receipt-row__value' : 'receipt-row__value'}>
                {fiscalSign || '—'}
              </span>
            </div>
          </section>
        </>
      ) : null}

      {showQrBlock ? (
        <footer className="receipt-section mt-3 border-t border-dashed border-black pt-3 text-center">
          {qrValue ? <ReceiptQrCode value={qrValue} sizePx={280} /> : null}
          <p className="receipt-subtitle mt-2">{t('fiscalReceipt.footer')}</p>
        </footer>
      ) : isOn('footer') ? (
        <footer className="receipt-section mt-3 border-t border-dashed border-black pt-3 text-center">
          <p className="receipt-subtitle">{t('fiscalReceipt.footer')}</p>
        </footer>
      ) : null}
    </>
  );
}
