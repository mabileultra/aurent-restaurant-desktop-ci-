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

export default function CompanyDayReceiptView({ receipt }) {
  const withQr = Boolean(receipt?.fiscalQrUrl);
  return (
    <div className="ca-receipts">
      <div className="ca-receipt-paper">
        <FiscalReceiptBody sale={paperSale(receipt, withQr)} printAreaId="company-receipt" />
      </div>
    </div>
  );
}
