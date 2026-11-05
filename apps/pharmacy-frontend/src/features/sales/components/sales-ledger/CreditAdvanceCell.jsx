import { fmtMoney } from '../../../../utils/formatMoney';

export default function CreditAdvanceCell({ row, t }) {
  const type = row.receiptType;
  if (type !== 'CREDIT' && type !== 'ADVANCE') {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <div className="flex flex-col items-end gap-0.5 text-right">
      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
        {t(`pos.receiptType.${type}`)}
      </span>
      {row.customerName ? (
        <span className="max-w-[12rem] truncate text-xs text-slate-600 dark:text-slate-300">
          {row.customerName}
        </span>
      ) : null}
      <span className="font-medium text-slate-900 dark:text-white">{fmtMoney(row.totalAmount)}</span>
    </div>
  );
}
