import { useTranslation } from 'react-i18next';
import { APP_NAME } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import ReceiptQrCode from './ReceiptQrCode';
import {
  fmtMoneyCompact,
  fmtQty,
  resolveFiscalReceiptTypeLabel,
  splitDateTime,
} from '../../utils/fiscalReceiptFormat';
import { extractVatFromInclusive } from '../../utils/taxAmounts';
import { cardTypeLabel } from '../../utils/salePaymentLabel';
import { unitCodeFromLabel } from '../../utils/unitConfig';
import {
  resolveFiscalReceiptMeta,
  resolveReceiptPaymentAmounts,
} from '../../utils/resolveFiscalReceiptMeta';

function lineVatRatePercent(item) {
  const rate = item?.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

function lineVatAmount(item) {
  const stored = Number(item?.taxAmount);
  if (Number.isFinite(stored) && stored >= 0.001) return stored;
  const rate = lineVatRatePercent(item);
  const lineTotal = Number(item?.lineTotal) || 0;
  return extractVatFromInclusive(lineTotal, rate);
}

function itemUnitPrice(item) {
  const direct = Number(item?.unitPrice ?? item?.price ?? item?.sellingPrice);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const qty = Number(item?.quantity) || 0;
  const total = Number(item?.lineTotal) || 0;
  return qty > 0 ? total / qty : total;
}

const PAYMENT_I18N = {
  CASH: 'sales.paymentCash',
  CARD: 'sales.paymentCard',
  CASHLESS: 'sales.paymentCashless',
  MPESA: 'sales.paymentMpesa',
  MIXED: 'salesLedger.filters.mixed',
};

function Row({ label, value, bold = false }) {
  return (
    <div className={`receipt-row${bold ? ' receipt-row--bold' : ''}`}>
      <span className="receipt-meta-label">{label}</span>
      <span className="receipt-row__value">{value}</span>
    </div>
  );
}

function ReceiptDivider() {
  return <div className="receipt-divider my-2 border-t border-dashed border-black" />;
}

export default function FiscalReceiptBody({ sale, printAreaId = 'receipt-print-area', className = '' }) {
  const { t } = useTranslation();
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
  const printFiscalQr = sale.printFiscalQr !== false;
  const qrValue = fiscalMeta.qrValue;
  const showQrBlock = printFiscalQr && isOn('qrCode') && Boolean(qrValue);

  const pay = resolveReceiptPaymentAmounts(sale);
  const cashAmt = pay.cashAmt;
  const cardAmt = pay.cardAmt;
  const paidTotal = pay.paidTotal;
  const change = pay.change;
  const method = pay.method;
  const total = Number(sale.totalAmount) || 0;
  const payLabel = (m) => t(PAYMENT_I18N[m] ?? 'sales.paymentCash');
  const cardTypeText = cardTypeLabel(sale.cardType, t);
  const shiftNo =
    import.meta.env.VITE_SHIFT_NO ||
    String(sale.receiptNumber || '').replace(/\D/g, '').slice(-3).padStart(3, '0') ||
    '001';
  const fmNumber = fiscalMeta.fmNumber;
  const virtualRegister = fiscalMeta.virtualRegister;
  const fiscalSign = fiscalMeta.fiscalSign;
  const fiscalReceiptNo = fiscalMeta.fiscalReceiptNo;

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
  const showMeta =
    isOn('dateTime') || isOn('receiptNo') || isOn('employee') || isOn('shift');

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
      ) : null}

      {showMeta ? (
        <section className="receipt-section mt-2 space-y-0.5">
          {isOn('dateTime') ? (
            <div className="receipt-row">
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
            <Row
              label={t('fiscalReceipt.originalReceiptNo')}
              value={`№${sale.originalReceiptNumber}`}
            />
          ) : null}
          {isOn('employee') && sale.cashierName ? (
            <Row label={t('fiscalReceipt.employee')} value={sale.cashierName} />
          ) : null}
          {isOn('shift') ? <Row label={t('fiscalReceipt.shift')} value={shiftNo} /> : null}
        </section>
      ) : null}

      {isOn('items') ? (
        <>
          <ReceiptDivider />
          <section className="receipt-section min-w-0">
            <div className="receipt-items-table space-y-2.5">
              {(sale.items ?? []).map((item, idx) => (
                  <div key={idx} className="receipt-items-table__item border-b border-dotted border-black pb-2 last:border-0">
                    <p className="receipt-items-table__name">{item.productName}</p>
                    <p className="receipt-items-table__qtyline">
                      {fmtQty(item.quantity, item.saleType, unitCodeFromLabel(item.unitOfMeasure))}
                      {' * '}
                      {fmtMoneyCompact(itemUnitPrice(item))}
                      {' = '}
                      {fmtMoneyCompact(item.lineTotal)}
                    </p>
                    {isOn('itemVatLine') ? (
                      <div className="receipt-items-table__vat">
                        <Row
                          label={t('fiscalReceipt.vatLineShort', {
                            rate: lineVatRatePercent(item).toFixed(0),
                          })}
                          value={fmtMoneyCompact(lineVatAmount(item))}
                        />
                      </div>
                    ) : null}
                    {isOn('itemIkpu') && item.ikpu ? (
                      <p className="break-all receipt-secondary">
                        {t('receipt.ikpuLine')}: {item.ikpu}
                      </p>
                    ) : null}
                  </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {(isOn('discounts') || isOn('grandTotal') || isOn('vatTotal')) && (
        <>
          <ReceiptDivider />
          <section className="receipt-section space-y-0.5">
            {isOn('discounts') && Number(sale.lineDiscountTotal ?? 0) > 0 ? (
              <Row
                label={t('fiscalReceipt.lineDiscountsSum')}
                value={fmtMoneyCompact(sale.lineDiscountTotal)}
              />
            ) : null}
            {isOn('discounts') && Number(sale.orderDiscountAmount ?? 0) > 0 ? (
              <Row
                label={
                  Number(sale.orderDiscountPercent ?? 0) > 0
                    ? t('fiscalReceipt.orderDiscountPercent', { percent: sale.orderDiscountPercent })
                    : t('fiscalReceipt.orderDiscountSum')
                }
                value={fmtMoneyCompact(sale.orderDiscountAmount)}
              />
            ) : null}
            {isOn('discounts') && Number(sale.discountTotal) > 0 ? (
              <Row
                label={t('fiscalReceipt.discountsSum')}
                value={fmtMoneyCompact(sale.discountTotal)}
                bold
              />
            ) : null}
            {isOn('grandTotal') ? (
              <Row
                label={t('fiscalReceipt.grandTotal')}
                value={fmtMoneyCompact(sale.totalAmount)}
                bold
              />
            ) : null}
            {isOn('vatTotal') ? (
              <Row
                label={t('fiscalReceipt.vatTotalLine', { rate: vatRateLabel })}
                value={fmtMoneyCompact(sale.taxTotal)}
                bold
              />
            ) : null}
          </section>
        </>
      )}

      {isOn('payment') ? (
        <>
          <div className="receipt-divider my-2 border-t border-dotted border-black" />
          <section className="receipt-section space-y-0.5">
            <Row label={t('fiscalReceipt.paymentForm')} value={fmtMoneyCompact(paidTotal || total)} />
            <Row label={t('fiscalReceipt.cash')} value={fmtMoneyCompact(cashAmt)} />
            <Row
              label={cardTypeText ? `${t('fiscalReceipt.plastic')} · ${cardTypeText}` : t('fiscalReceipt.plastic')}
              value={fmtMoneyCompact(cardAmt)}
            />
            {method !== 'CASH' && method !== 'MIXED' && method !== 'CARD' && method !== 'CASHLESS' && method !== 'MPESA' ? (
              <Row label={payLabel(method)} value={fmtMoneyCompact(total)} />
            ) : null}
            {change > 0 ? (
              <Row label={t('receipt.change')} value={fmtMoneyCompact(change)} bold />
            ) : null}
          </section>
        </>
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
            {fiscalReceiptNo ? (
              <Row label={t('fiscalReceipt.fiscalReceiptNo')} value={fiscalReceiptNo} />
            ) : null}
            {fmNumber ? <Row label={t('fiscalReceipt.fmNumber')} value={fmNumber} /> : null}
            {virtualRegister ? (
              <Row label={t('fiscalReceipt.virtualRegister')} value={virtualRegister} />
            ) : null}
            <div className="receipt-row">
              <span className="receipt-meta-label">{t('fiscalReceipt.fiscalSign')}</span>
              <span className="receipt-fiscal-sign receipt-row__value">
                {fiscalSign || '—'}
              </span>
            </div>
          </section>
        </>
      ) : null}

      {showQrBlock ? (
        <footer className="receipt-section mt-3 border-t border-dashed border-black pt-3 text-center">
          {qrValue ? <ReceiptQrCode value={qrValue} sizePx={200} /> : null}
        </footer>
      ) : null}
    </div>
  );
}
