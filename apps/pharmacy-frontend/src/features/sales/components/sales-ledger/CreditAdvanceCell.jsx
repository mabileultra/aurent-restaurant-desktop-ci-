import { fmtMoney } from '../../../../utils/formatMoney';

export default function CreditAdvanceCell({ row, t }) {
  const type = row.receiptType;
  if (type !== 'CREDIT' && type !== 'ADVANCE') {
    return <span className="text-ink-disabled">—</span>;
  }
  return (
    <div className="ui-tabular flex flex-col items-end gap-0.5 text-right">
      <span className="ui-badge-warning">
        {t(`pos.receiptType.${type}`)}
      </span>
      {row.customerName ? (
        <span className="max-w-[12rem] truncate text-xs text-ink-muted" title={row.customerName}>
          {row.customerName}
        </span>
      ) : null}
      <span className="whitespace-nowrap font-semibold text-ink">{fmtMoney(row.totalAmount)}</span>
    </div>
  );
}
