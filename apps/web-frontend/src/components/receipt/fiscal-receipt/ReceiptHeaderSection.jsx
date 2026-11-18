import React from 'react';

/** Шапка: логотип и реквизиты компании. */
export default function ReceiptHeaderSection({ branding, isOn, t }) {
  const { logoDataUrl, companyName, companyAddress, companyPhone, stir } = branding;
  const isVisible =
    isOn('logo') ||
    isOn('companyName') ||
    isOn('companyAddress') ||
    (isOn('companyPhone') && companyPhone) ||
    (isOn('stir') && stir);

  if (!isVisible) return null;

  return (
    <header className="receipt-section border-b border-dashed border-black pb-3 text-center">
      {isOn('logo') && logoDataUrl ? (
        <img src={logoDataUrl} alt="" className="receipt-logo mx-auto mb-2" />
      ) : null}
      {isOn('companyName') ? (
        <p className="receipt-title break-words">{companyName}</p>
      ) : null}
      {isOn('companyAddress') && companyAddress ? (
        <p className="receipt-subtitle mt-1 whitespace-pre-line break-words">{companyAddress}</p>
      ) : null}
      {isOn('companyPhone') && companyPhone ? (
        <p className="receipt-subtitle mt-1 break-words">
          {t('fiscalReceipt.phoneLabel')}: {companyPhone}
        </p>
      ) : null}
      {isOn('stir') && stir ? (
        <p className="receipt-subtitle mt-1">
          {t('fiscalReceipt.stir')}: {stir}
        </p>
      ) : null}
    </header>
  );
}
