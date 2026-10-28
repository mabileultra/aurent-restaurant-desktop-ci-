import React from 'react';
import { FiscalReceiptBody } from '../../../../components/receipt';

function paperSale(receipt, printFiscalQr) {
  return {
    ...receipt,
    id: receipt.saleId,
    printFiscalQr,
    items: (receipt.items ?? []).map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      taxAmount: item.taxAmount,
    })),
  };
}

export default function CompanyDayReceiptView({ t, receipt }) {
  const withQr = Boolean(receipt?.fiscalQrUrl);
  return (
    <div className={`ca-receipts${withQr ? ' ca-receipts--pair' : ''}`}>
      <div className="ca-receipt-paper">
        <p className="ca-receipt-paper__label">{withQr ? t('platform.analytics.receiptWithQr') : t('platform.analytics.receiptPunched')}</p>
        <FiscalReceiptBody sale={paperSale(receipt, withQr)} printAreaId="company-receipt-qr" />
      </div>
      {withQr ? (
        <div className="ca-receipt-paper">
          <p className="ca-receipt-paper__label">{t('platform.analytics.receiptWithoutQr')}</p>
          <FiscalReceiptBody sale={paperSale(receipt, false)} printAreaId="company-receipt-plain" />
        </div>
      ) : null}
    </div>
  );
}
