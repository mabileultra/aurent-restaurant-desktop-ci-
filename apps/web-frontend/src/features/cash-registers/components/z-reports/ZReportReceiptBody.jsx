import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { fmtMoney } from '../../../../utils/formatMoney';
import { useTenantDisplayStore } from '../../../../store/tenantDisplayStore';

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

export default function ZReportReceiptBody({ z }) {
  const { t } = useTranslation();
  const committed = useTenantDisplayStore((s) => s.committed);
  const isReceiptFieldOn = useTenantDisplayStore((s) => s.isReceiptFieldOn);

  if (!z) return null;

  const currency = t('fiscalReceipt.currency');
  const company =
    String(committed.receiptCompanyName || '').trim() ||
    String(z.companyName || '').trim() ||
    String(z.storeName || '').trim() ||
    'Aurent';
  const address =
    String(committed.receiptCompanyAddress || '').trim() || String(z.companyAddress || '').trim();
  const phone = String(committed.receiptCompanyPhone || '').trim();
  const tin = String(committed.receiptStir || '').trim() || String(z.tin || '').trim();

  const returnsTotal =
    moneyNum(z.returnsCash) +
    moneyNum(z.returnsCard) +
    moneyNum(z.returnsHumo) +
    moneyNum(z.returnsUzcard) +
    moneyNum(z.returnsCashless);
  const hasReturns = (z.returnsCount ?? 0) > 0 || returnsTotal !== 0 || moneyNum(z.vatReturn) !== 0;

  return (
    <>
      <header className="receipt-section border-b border-dashed border-black pb-2 text-center">
        <p className="receipt-title">{company}</p>
        <p className="receipt-subtitle mt-0.5 font-bold uppercase">{t('pos.zReport')}</p>
        {isReceiptFieldOn('companyAddress') && address ? (
          <p className="receipt-secondary mt-0.5 whitespace-pre-line">{address}</p>
        ) : null}
        {isReceiptFieldOn('companyPhone') && phone ? (
          <p className="receipt-secondary">
            {t('fiscalReceipt.phoneLabel')}: {phone}
          </p>
        ) : null}
      </header>

      <section className="receipt-section mt-1 space-y-0.5">
        <Row label={t('zReports.printTerminalSerial')} value={z.terminalSerial ?? '—'} />
        <Row label={t('zReports.printAppletVer')} value={z.appletVersion ?? '—'} />
        <Row label={t('zReports.printEmployee')} value={z.employeeName ?? '—'} />
        <Row label={t('zReports.printStoreName')} value={z.storeName ?? '—'} />
        <Row label={t('cashRegisters.colFiscal')} value={z.fiscalCardId ?? '—'} />
        {isReceiptFieldOn('stir') && tin ? <Row label={t('fiscalReceipt.stir')} value={tin} /> : null}
        <Row label={t('zReports.printZNumber')} value={String(z.zNumber ?? '—')} bold />
      </section>

      <div className="receipt-divider my-1.5 border-t border-dashed border-black" />

      <section className="receipt-section space-y-0.5">
        <p className="receipt-section-title mb-0.5">{t('zReports.sectionSale')}</p>
        <MoneyRow label={t('zReports.saleCash')} amount={z.cashTotal} currency={currency} always />
        <MoneyRow label={t('zReports.saleCard')} amount={z.cardTotal} currency={currency} />
        <MoneyRow label={t('zReports.saleHumo')} amount={z.humoTotal} currency={currency} />
        <MoneyRow label={t('zReports.saleUzcard')} amount={z.uzcardTotal} currency={currency} />
        <MoneyRow label={t('zReports.saleCashless')} amount={z.cashlessTotal} currency={currency} />
        <MoneyRow label={t('zReports.saleVat')} amount={z.vatAmount} currency={currency} />
        <Row label={t('zReports.saleCount')} value={String(z.salesCount ?? 0)} />
        <MoneyRow label={t('fiscalReceipt.lineDiscountsSum')} amount={z.lineDiscountTotal} currency={currency} />
        <MoneyRow label={t('fiscalReceipt.orderDiscountSum')} amount={z.orderDiscountTotal} currency={currency} />
        <MoneyRow label={t('fiscalReceipt.discountsSum')} amount={z.discountTotal} currency={currency} bold />
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
            <MoneyRow label={t('zReports.returnCash')} amount={z.returnsCash} currency={currency} />
            <MoneyRow label={t('zReports.returnCard')} amount={z.returnsCard} currency={currency} />
            <MoneyRow label={t('zReports.returnHumo')} amount={z.returnsHumo} currency={currency} />
            <MoneyRow label={t('zReports.returnUzcard')} amount={z.returnsUzcard} currency={currency} />
            <MoneyRow label={t('zReports.returnCashless')} amount={z.returnsCashless} currency={currency} />
            <MoneyRow label={t('zReports.returnVat')} amount={z.vatReturn} currency={currency} />
            <Row label={t('zReports.returnCount')} value={String(z.returnsCount ?? 0)} />
          </section>
        </>
      ) : null}

      <div className="receipt-divider my-1.5 border-t border-dotted border-black" />

      <section className="receipt-section space-y-0.5">
        <Row label={t('zReports.openedAt')} value={fmtAt(z.openedAt)} />
        <Row label={t('zReports.closedAt')} value={fmtAt(z.closedAt)} />
        <Row label={t('zReports.firstReceipt')} value={z.firstReceiptNumber ?? '—'} />
        <Row label={t('zReports.lastReceipt')} value={z.lastReceiptNumber ?? '—'} />
      </section>

      <div className="receipt-divider my-1.5 border-t border-dashed border-black" />

      <section className="receipt-section">
        <Row label={t('zReports.grandTotal')} value={`${fmtMoney(z.totalAmount)} ${currency}`} bold />
      </section>
    </>
  );
}
