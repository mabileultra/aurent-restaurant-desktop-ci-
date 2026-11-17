import React from 'react';
import ReceiptQrCode from '../ReceiptQrCode';

const FISCAL_QR_SIZE_PX = 280;
const FOOTER_CLS = 'receipt-section mt-3 border-t border-dashed border-black pt-3 text-center';

/** Подвал: фискальный QR (если есть) и благодарность покупателю. */
export default function ReceiptFooterSection({ qrValue, showQrBlock, isOn, t }) {
  if (showQrBlock) {
    return (
      <footer className={FOOTER_CLS}>
        {qrValue ? <ReceiptQrCode value={qrValue} sizePx={FISCAL_QR_SIZE_PX} /> : null}
        <p className="receipt-subtitle mt-2">{t('fiscalReceipt.footer')}</p>
      </footer>
    );
  }
  if (!isOn('footer')) return null;

  return (
    <footer className={FOOTER_CLS}>
      <p className="receipt-subtitle">{t('fiscalReceipt.footer')}</p>
    </footer>
  );
}
