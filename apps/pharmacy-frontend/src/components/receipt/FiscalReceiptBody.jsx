import React from 'react';
import { APP_NAME } from '../../config/brand';
import { getReceiptTranslator } from '../../utils/receiptI18n';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import PharmacyReceiptFiscalFooter from './PharmacyReceiptFiscalFooter';
import PharmacyReceiptItemsAndTotals, {
  PharmacyReceiptRow as Row,
} from './PharmacyReceiptItemsAndTotals';
import {
  fmtMoneyCompact,
  resolveFiscalReceiptTypeLabel,
  splitDateTime,
} from '../../utils/fiscalReceiptFormat';
import {
  extractCardReceiptDetails,
  normalizeCardCategory,
  resolveSalePrescriptionNumber,
  shouldPrintFiscalQr,
} from '@aurent/shared-fiscal';
import { cardCategoryLabel, cardTypeLabel } from '../../utils/salePaymentLabel';
import {
  resolveFiscalReceiptMeta,
  resolveReceiptPaymentAmounts,
} from '../../utils/resolveFiscalReceiptMeta';
import { resolveReceiptShiftLabel } from '../../utils/resolveReceiptShiftLabel';

const PAYMENT_I18N = {
  CASH: 'sales.paymentCash',
  CARD: 'sales.paymentCard',
  CASHLESS: 'sales.paymentCashless',
  MPESA: 'sales.paymentMpesa',
  MIXED: 'salesLedger.filters.mixed',
};

export default function FiscalReceiptBody({ sale, printAreaId = 'receipt-print-area', className = '' }) {
  const t = getReceiptTranslator();
  const isOn = useTenantDisplayStore((s) => s.isReceiptFieldOn);
  const receiptLogoDataUrl = useTenantDisplayStore((s) => s.committed.receiptLogoDataUrl);
  const customCompanyName = useTenantDisplayStore((s) => s.committed.receiptCompanyName);
  const customCompanyAddress = useTenantDisplayStore((s) => s.committed.receiptCompanyAddress);
  const customCompanyPhone = useTenantDisplayStore((s) => s.committed.receiptCompanyPhone);
  const customStir = useTenantDisplayStore((s) => s.committed.receiptStir);

  if (!sale) return null;

  const companyName =
    customCompanyName ||
    import.meta.env.VITE_COMPANY_NAME ||
    sale.storeName ||
    APP_NAME;
  const companyAddress = customCompanyAddress || import.meta.env.VITE_COMPANY_ADDRESS || '';
  const companyPhone = customCompanyPhone || import.meta.env.VITE_COMPANY_PHONE || '';
  const stir = customStir || import.meta.env.VITE_COMPANY_STIR || import.meta.env.VITE_STIR || '';
  const { date, time } = splitDateTime(sale.createdAt);
  const fiscalMeta = resolveFiscalReceiptMeta(sale, {
    fmNumber: import.meta.env.VITE_FISCAL_MODULE_NUMBER || import.meta.env.VITE_FISCAL_CARD_ID || '',
    virtualRegister: import.meta.env.VITE_VIRTUAL_REGISTER_ID || import.meta.env.VITE_REGISTER_NO || '',
  });
  const printFiscalQr = sale.printFiscalQr !== false && shouldPrintFiscalQr(sale?.receiptType);
  const qrValue = fiscalMeta.qrValue;
  const showQrBlock = printFiscalQr && isOn('qrCode') && Boolean(qrValue);

  const pay = resolveReceiptPaymentAmounts(sale);
  const { cashAmt, cardAmt, paidTotal, change, method } = pay;
  const total = Number(sale.totalAmount) || 0;
  const payLabel = (m) => t(PAYMENT_I18N[m] ?? 'sales.paymentCash');
  const cardDetails = extractCardReceiptDetails(sale);
  const prescriptionNumber = resolveSalePrescriptionNumber(sale);
  const hasCardPayment = Number(cardAmt) > 0 || method === 'CARD' || method === 'MIXED';
  const isSocialCategory = hasCardPayment && cardDetails.cardCategory === 'SOCIAL';
  const cardProviderText =
    hasCardPayment && !normalizeCardCategory(sale.cardType) ? cardTypeLabel(sale.cardType, t) : null;
  const cardCategoryText = hasCardPayment ? cardCategoryLabel(cardDetails.cardCategory, t) : null;
  const shiftNo = resolveReceiptShiftLabel(sale, {
    envShiftNo: import.meta.env.VITE_SHIFT_NO,
  });

  const vatRates = new Set(
    (sale.items ?? [])
      .map((i) => (i.taxRatePercent != null ? Number(i.taxRatePercent) : 12))
      .filter((r) => r > 0)
  );
  const vatRateLabel = vatRates.size === 1 ? `${[...vatRates][0].toFixed(0)}` : '—';
  const receiptTypeLabel = resolveFiscalReceiptTypeLabel(sale, t);

  const showHeader =
    isOn('logo') ||
    isOn('companyName') ||
    isOn('companyAddress') ||
    (isOn('companyPhone') && companyPhone) ||
    (isOn('stir') && stir);
  const showMeta = isOn('dateTime') || isOn('receiptNo') || isOn('employee') || isOn('shift');

  return (
    <div
      id={printAreaId}
      className={`receipt-print-root min-w-0 max-w-full overflow-hidden ${className}`}
    >
      {showHeader ? (
        <header className="receipt-section border-b border-dashed border-black pb-3 text-center">
          {isOn('logo') && receiptLogoDataUrl ? (
            <img src={receiptLogoDataUrl} alt="" className="receipt-logo mx-auto mb-2" />
          ) : null}
          {isOn('companyName') ? <p className="receipt-title break-words">{companyName}</p> : null}
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
      ) : null}

      {showMeta ? (
        <section className="receipt-section mt-2 space-y-0.5">
          {isOn('dateTime') ? (
            <div className="receipt-row receipt-row--datetime">
              <span>
                <span className="receipt-meta-label">{t('fiscalReceipt.time')}: </span>
                {time}
              </span>
              <span className="receipt-row__value">
                <span className="receipt-meta-label">{t('fiscalReceipt.date')}: </span>
                {date}
              </span>
            </div>
          ) : null}
          {isOn('receiptNo') ? (
            <Row label={t('fiscalReceipt.receiptNoShort')} value={`№${sale.receiptNumber}`} />
          ) : null}
          {sale.originalReceiptNumber ? (
            <Row label={t('fiscalReceipt.originalReceiptNo')} value={`№${sale.originalReceiptNumber}`} />
          ) : null}
          {isOn('employee') && sale.cashierName ? (
            <Row label={t('fiscalReceipt.employee')} value={sale.cashierName} />
          ) : null}
          {isOn('shift') ? <Row label={t('fiscalReceipt.shift')} value={shiftNo} /> : null}
        </section>
      ) : null}

      <PharmacyReceiptItemsAndTotals sale={sale} isOn={isOn} vatRateLabel={vatRateLabel} t={t} />

      {isOn('payment') ? (
        <>
          <div className="receipt-divider my-2 border-t border-dotted border-black" />
          <section className="receipt-section space-y-0.5">
            <Row label={t('fiscalReceipt.paymentForm')} value={fmtMoneyCompact(paidTotal || total)} />
            <Row label={t('fiscalReceipt.cash')} value={fmtMoneyCompact(cashAmt)} />
            <Row
              label={cardProviderText ? `${t('fiscalReceipt.plastic')} · ${cardProviderText}` : t('fiscalReceipt.plastic')}
              value={fmtMoneyCompact(cardAmt)}
            />
            {cardCategoryText ? <Row label={t('fiscalReceipt.cardType')} value={cardCategoryText} /> : null}
            {isSocialCategory && cardDetails.socialCardNumber ? (
              <Row label={t('fiscalReceipt.socialCardNumber')} value={cardDetails.socialCardNumber} />
            ) : null}
            {hasCardPayment && cardDetails.rrn ? <Row label={t('fiscalReceipt.cardRrn')} value={cardDetails.rrn} /> : null}
            {method !== 'CASH' && method !== 'MIXED' && method !== 'CARD' && method !== 'CASHLESS' && method !== 'MPESA' ? (
              <Row label={payLabel(method)} value={fmtMoneyCompact(total)} />
            ) : null}
            {change > 0 ? <Row label={t('receipt.change')} value={fmtMoneyCompact(change)} bold /> : null}
          </section>
        </>
      ) : null}

      <PharmacyReceiptFiscalFooter
        fiscalMeta={fiscalMeta}
        prescriptionNumber={prescriptionNumber}
        receiptTypeLabel={receiptTypeLabel}
        showQrBlock={showQrBlock}
        isOn={isOn}
        t={t}
      />
    </div>
  );
}
