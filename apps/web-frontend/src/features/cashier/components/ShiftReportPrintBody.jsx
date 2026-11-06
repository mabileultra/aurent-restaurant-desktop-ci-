import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { fmtMoney } from '../../../utils/formatMoney';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';

const fmtAt = (iso) => {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'dd.MM.yyyy HH:mm');
  } catch {
    return '—';
  }
};

const moneyNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function Row({ label, value, bold = false }) {
  return (
    <div className={`receipt-row${bold ? ' receipt-row--bold' : ''}`}>
      <span className="receipt-meta-label">{label}</span>
      <span className="receipt-row__value">{value}</span>
    </div>
  );
}

function MoneyRow({ label, amount, currency, bold = false, always = false }) {
  if (!always && moneyNum(amount) === 0) return null;
  return <Row label={label} value={`${fmtMoney(amount)} ${currency}`} bold={bold} />;
}

export default function ShiftReportPrintBody({ report }) {
  const { t } = useTranslation();
  const committed = useTenantDisplayStore((s) => s.committed);
  const isReceiptFieldOn = useTenantDisplayStore((s) => s.isReceiptFieldOn);

  if (!report) return null;

  const title = report.reportType === 'X' ? t('pos.xReport') : t('pos.zReport');
  const currency = t('fiscalReceipt.currency');
  const companyName =
    String(committed.receiptCompanyName || '').trim() ||
    String(report.storeName || '').trim() ||
    'Aurent';
  const address = String(committed.receiptCompanyAddress || '').trim();
  const phone = String(committed.receiptCompanyPhone || '').trim();
  const stir = String(committed.receiptStir || '').trim();
  const storeName = String(report.storeName || '').trim();

  const returnsTotal =
    moneyNum(report.returnsCash) +
    moneyNum(report.returnsCard) +
    moneyNum(report.returnsHumo) +
    moneyNum(report.returnsUzcard) +
    moneyNum(report.returnsCashless);
  const hasReturns =
    (report.returnsCount ?? 0) > 0 || returnsTotal !== 0 || moneyNum(report.returnsVat) !== 0;

  return (
    <>
      <header className="receipt-section border-b border-dashed border-black pb-2 text-center">
        <p className="receipt-title">{companyName}</p>
        <p className="receipt-subtitle mt-0.5 font-bold uppercase">{title}</p>
        {isReceiptFieldOn('companyAddress') && address ? (
          <p className="receipt-secondary">{address}</p>
        ) : null}
        {isReceiptFieldOn('companyPhone') && phone ? (
          <p className="receipt-secondary">
            {t('fiscalReceipt.phoneLabel')}: {phone}
          </p>
        ) : null}
        {isReceiptFieldOn('stir') && stir ? (
          <p className="receipt-secondary">
            {t('fiscalReceipt.stir')}: {stir}
          </p>
        ) : null}
        {storeName && storeName.toLowerCase() !== companyName.toLowerCase() ? (
          <p className="receipt-secondary">{storeName}</p>
        ) : null}
      </header>

      {report.cashierName ? (
        <section className="receipt-section mt-1 space-y-0.5">
          <Row label={t('users.roleCashier')} value={report.cashierName} />
        </section>
      ) : null}

      <section className="receipt-section mt-1 space-y-0.5">
        <Row label={t('zReports.openedAt')} value={fmtAt(report.openedAt)} />
        <Row label={t('pos.reportAt')} value={fmtAt(report.reportAt)} />
      </section>

      <div className="receipt-divider my-1.5 border-t border-dashed border-black" />

      <section className="receipt-section space-y-0.5">
        <Row label={t('pos.shiftSales')} value={String(report.saleCount)} />
        <MoneyRow label={t('pos.shiftTotal')} amount={report.totalAmount} currency={currency} bold always />
        <MoneyRow label={t('pos.shiftCash')} amount={report.cashAmount} currency={currency} always />
        <MoneyRow label={t('pos.shiftCard')} amount={report.cardAmount} currency={currency} />
        <MoneyRow label={t('pos.shiftHumo')} amount={report.humoAmount} currency={currency} />
        <MoneyRow label={t('pos.shiftUzcard')} amount={report.uzcardAmount} currency={currency} />
        <MoneyRow label={t('pos.shiftCashless')} amount={report.cashlessAmount} currency={currency} />
        <MoneyRow label={t('pos.shiftVat')} amount={report.vatAmount} currency={currency} />
        <MoneyRow label={t('fiscalReceipt.lineDiscountsSum')} amount={report.lineDiscountTotal} currency={currency} />
        <MoneyRow label={t('fiscalReceipt.orderDiscountSum')} amount={report.orderDiscountTotal} currency={currency} />
        <MoneyRow label={t('fiscalReceipt.discountsSum')} amount={report.discountTotal} currency={currency} bold />
      </section>

      {hasReturns ? (
        <>
          <div className="receipt-divider my-1.5 border-t border-dotted border-black" />
          <section className="receipt-section space-y-0.5">
            <MoneyRow
              label={t('zReports.sectionReturn')}
              amount={returnsTotal}
              currency={currency}
              bold
              always
            />
            <MoneyRow label={t('zReports.returnCash')} amount={report.returnsCash} currency={currency} />
            <MoneyRow label={t('zReports.returnCard')} amount={report.returnsCard} currency={currency} />
            <MoneyRow label={t('zReports.returnHumo')} amount={report.returnsHumo} currency={currency} />
            <MoneyRow label={t('zReports.returnUzcard')} amount={report.returnsUzcard} currency={currency} />
            <MoneyRow label={t('zReports.returnCashless')} amount={report.returnsCashless} currency={currency} />
            <MoneyRow label={t('zReports.returnVat')} amount={report.returnsVat} currency={currency} />
            <Row label={t('zReports.returnCount')} value={String(report.returnsCount ?? 0)} />
          </section>
        </>
      ) : null}
    </>
  );
}
