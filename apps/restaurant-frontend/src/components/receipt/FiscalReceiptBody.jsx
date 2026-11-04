import { useTranslation } from 'react-i18next';
import { APP_NAME } from '../../config/brand';
import { receiptFieldStyleProps } from '../../receiptProfile/receiptFieldStyles';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import {
  resolveFiscalReceiptTypeLabel,
  splitDateTime,
} from '../../utils/fiscalReceiptFormat';
import { cardTypeLabel } from '../../utils/salePaymentLabel';
import {
  resolveFiscalReceiptMeta,
  resolveReceiptPaymentAmounts,
} from '../../utils/resolveFiscalReceiptMeta';
import { resolveReceiptShiftLabel } from '../../utils/resolveReceiptShiftLabel';
import ReceiptQrCode from './ReceiptQrCode';
import FiscalReceiptFiscalBlock from './FiscalReceiptFiscalBlock';
import FiscalReceiptHeaderBlock from './FiscalReceiptHeaderBlock';
import FiscalReceiptItemsBlock from './FiscalReceiptItemsBlock';
import FiscalReceiptMetaBlock from './FiscalReceiptMetaBlock';
import FiscalReceiptPaymentBlock from './FiscalReceiptPaymentBlock';
import FiscalReceiptTotalsBlock from './FiscalReceiptTotalsBlock';
import './fiscal-field-styles.css';

export default function FiscalReceiptBody({
  sale,
  header = null,
  printAreaId = 'receipt-print-area',
  className = '',
}) {
  const { t } = useTranslation();
  const isOn = useTenantDisplayStore((s) => s.isReceiptFieldOn);
  const fieldStyles = useTenantDisplayStore((s) => s.committed.receiptFieldStyles);
  const receiptLogoDataUrl = useTenantDisplayStore((s) => s.committed.receiptLogoDataUrl);
  const customCompanyName = useTenantDisplayStore((s) => s.committed.receiptCompanyName);
  const customCompanyAddress = useTenantDisplayStore((s) => s.committed.receiptCompanyAddress);
  const customCompanyPhone = useTenantDisplayStore((s) => s.committed.receiptCompanyPhone);
  const customStir = useTenantDisplayStore((s) => s.committed.receiptStir);
  const fs = (key, extra = '') => {
    const p = receiptFieldStyleProps(fieldStyles?.[key]);
    return {
      className: [extra, p.className].filter(Boolean).join(' '),
      style: p.style,
    };
  };

  if (!sale) return null;

  const companyName =
    header?.companyName ||
    customCompanyName ||
    import.meta.env.VITE_COMPANY_NAME ||
    sale.storeName ||
    APP_NAME;
  const companyAddress =
    header?.companyAddress || customCompanyAddress || import.meta.env.VITE_COMPANY_ADDRESS || '';
  const companyPhone =
    header?.companyPhone || customCompanyPhone || import.meta.env.VITE_COMPANY_PHONE || '';
  const logoSrc = header?.logoDataUrl || receiptLogoDataUrl || '';
  const showLogo = Boolean(header?.logoDataUrl) || (isOn('logo') && Boolean(receiptLogoDataUrl));
  const showName = Boolean(header?.companyName) || isOn('companyName');
  const showAddress =
    Boolean(header?.companyAddress) || (isOn('companyAddress') && Boolean(companyAddress));
  const showPhone = Boolean(header?.companyPhone) || (isOn('companyPhone') && Boolean(companyPhone));
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
  const cardTypeText = cardTypeLabel(sale.cardType, t);
  const shiftNo = resolveReceiptShiftLabel(sale, {
    envShiftNo: import.meta.env.VITE_SHIFT_NO,
  });
  const total = Number(sale.totalAmount) || 0;

  const vatRates = new Set(
    (sale.items ?? [])
      .map((i) => (i.taxRatePercent != null ? Number(i.taxRatePercent) : 12))
      .filter((r) => r > 0),
  );
  const vatRateLabel = vatRates.size === 1 ? `${[...vatRates][0].toFixed(0)}` : '—';
  const receiptTypeLabel = resolveFiscalReceiptTypeLabel(sale, t);

  const showHeader =
    showLogo || showName || showAddress || showPhone || (isOn('stir') && stir);
  const showMeta =
    isOn('dateTime') || isOn('receiptNo') || isOn('employee') || isOn('shift');
  const showTotals =
    isOn('service') || isOn('discounts') || isOn('grandTotal') || isOn('vatTotal');

  return (
    <div
      id={printAreaId}
      className={`receipt-print-root min-w-0 max-w-full overflow-hidden ${className}`}
    >
      {showHeader ? (
        <FiscalReceiptHeaderBlock
          showLogo={showLogo}
          logoSrc={logoSrc}
          logoMaxHeightMm={header?.logoMaxHeightMm}
          showName={showName}
          companyName={companyName}
          showAddress={showAddress}
          companyAddress={companyAddress}
          showPhone={showPhone}
          companyPhone={companyPhone}
          showStir={isOn('stir')}
          stir={stir}
          phoneLabel={t('fiscalReceipt.phoneLabel')}
          stirLabel={t('fiscalReceipt.stir')}
          fs={fs}
        />
      ) : null}

      {showMeta ? (
        <FiscalReceiptMetaBlock
          isOn={isOn}
          fs={fs}
          time={time}
          date={date}
          receiptNumber={sale.receiptNumber}
          originalReceiptNumber={sale.originalReceiptNumber}
          cashierName={sale.cashierName}
          shiftNo={shiftNo}
          labels={{
            time: t('fiscalReceipt.time'),
            date: t('fiscalReceipt.date'),
            receiptNo: t('fiscalReceipt.receiptNoShort'),
            originalReceiptNo: t('fiscalReceipt.originalReceiptNo'),
            employee: t('fiscalReceipt.employee'),
            shift: t('fiscalReceipt.shift'),
          }}
        />
      ) : null}

      {isOn('items') ? (
        <FiscalReceiptItemsBlock items={sale.items} isOn={isOn} fs={fs} t={t} />
      ) : null}

      {showTotals ? (
        <FiscalReceiptTotalsBlock sale={sale} isOn={isOn} fs={fs} t={t} vatRateLabel={vatRateLabel} />
      ) : null}

      <FiscalReceiptPaymentBlock
        isOn={isOn}
        fs={fs}
        t={t}
        paidTotal={pay.paidTotal}
        total={total}
        cashAmt={pay.cashAmt}
        cardAmt={pay.cardAmt}
        cardTypeText={cardTypeText}
        method={pay.method}
        change={pay.change}
      />

      <FiscalReceiptFiscalBlock
        isOn={isOn}
        fs={fs}
        t={t}
        fiscalReceiptNo={fiscalMeta.fiscalReceiptNo}
        fmNumber={fiscalMeta.fmNumber}
        virtualRegister={fiscalMeta.virtualRegister}
        fiscalSign={fiscalMeta.fiscalSign}
        receiptTypeLabel={receiptTypeLabel}
      />

      {showQrBlock ? (
        <footer {...fs('qrCode', 'receipt-section mt-3 border-t border-dashed border-black pt-3')}>
          {qrValue ? <ReceiptQrCode value={qrValue} sizePx={200} /> : null}
        </footer>
      ) : null}
      {header?.footer ? (
        <p {...fs('footer', 'receipt-subtitle mt-3 break-words')}>{header.footer}</p>
      ) : null}
    </div>
  );
}
