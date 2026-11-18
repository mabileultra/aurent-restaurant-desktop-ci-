import { fmtMoney } from '../../../../utils/formatMoney';
import { getReceiptTranslator } from '../../../../utils/receiptI18n';
import { useTenantDisplayStore } from '../../../../store/tenantDisplayStore';
import '../../styles/shift-report-print.css';

function fmtAt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function moneyNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function Row({ label, value, bold = false }) {
  return (
    <div className={`rst-shift-report__row${bold ? ' is-bold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function MoneyRow({ label, amount, currency, bold = false, always = false }) {
  if (!always && moneyNum(amount) === 0) return null;
  return <Row label={label} value={`${fmtMoney(amount)} ${currency}`} bold={bold} />;
}

/**
 * Thermal X/Z body for restaurant shift reports.
 */
export default function ShiftReportPrintBody({ report, t }) {
  const tReceipt = getReceiptTranslator(t);
  const committed = useTenantDisplayStore((s) => s.committed);
  const isReceiptFieldOn = useTenantDisplayStore((s) => s.isReceiptFieldOn);

  if (!report) return null;

  const title = report.reportType === 'X' ? tReceipt('pos.xReport') : tReceipt('pos.zReport');
  const currency = tReceipt('fiscalReceipt.currency');
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
    <div className="rst-shift-report">
      <header className="rst-shift-report__head">
        <p className="rst-shift-report__company">{companyName}</p>
        <p className="rst-shift-report__title">{title}</p>
        {isReceiptFieldOn('companyAddress') && address ? (
          <p className="rst-shift-report__meta">{address}</p>
        ) : null}
        {isReceiptFieldOn('companyPhone') && phone ? (
          <p className="rst-shift-report__meta">
            {tReceipt('fiscalReceipt.phoneLabel')}: {phone}
          </p>
        ) : null}
        {isReceiptFieldOn('stir') && stir ? (
          <p className="rst-shift-report__meta">
            {tReceipt('fiscalReceipt.stir')}: {stir}
          </p>
        ) : null}
        {storeName && storeName.toLowerCase() !== companyName.toLowerCase() ? (
          <p className="rst-shift-report__meta">{storeName}</p>
        ) : null}
      </header>

      {report.cashierName ? (
        <section className="rst-shift-report__section">
          <Row label={tReceipt('users.roleCashier')} value={report.cashierName} />
        </section>
      ) : null}

      <section className="rst-shift-report__section">
        <Row label={tReceipt('zReports.openedAt')} value={fmtAt(report.openedAt)} />
        <Row label={tReceipt('pos.reportAt')} value={fmtAt(report.reportAt)} />
      </section>

      <div className="rst-shift-report__divider" />

      <section className="rst-shift-report__section">
        <Row label={tReceipt('pos.shiftSales')} value={String(report.saleCount ?? 0)} />
        <MoneyRow label={tReceipt('pos.shiftTotal')} amount={report.totalAmount} currency={currency} bold always />
        <MoneyRow label={tReceipt('pos.shiftCash')} amount={report.cashAmount} currency={currency} always />
        <MoneyRow label={tReceipt('pos.shiftCard')} amount={report.cardAmount} currency={currency} always />
        <MoneyRow label={tReceipt('rst.shift.openingCash')} amount={report.openingCash} currency={currency} always />
        {report.reportType === 'Z' ? (
          <MoneyRow label={tReceipt('rst.shift.closingCash')} amount={report.closingCash} currency={currency} always />
        ) : null}
      </section>

      {hasReturns ? (
        <>
          <div className="rst-shift-report__divider" />
          <section className="rst-shift-report__section">
            <MoneyRow
              label={tReceipt('zReports.sectionReturn')}
              amount={returnsTotal}
              currency={currency}
              bold
              always
            />
            <Row label={tReceipt('zReports.returnCount')} value={String(report.returnsCount ?? 0)} />
          </section>
        </>
      ) : null}
    </div>
  );
}
