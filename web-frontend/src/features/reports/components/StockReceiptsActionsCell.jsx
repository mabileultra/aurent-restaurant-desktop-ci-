import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';

export default function StockReceiptsActionsCell({
  t,
  editTo,
  deleting,
  onDelete,
}) {
  return (
    <td className="px-4 py-2 text-right whitespace-nowrap">
      <div className="inline-flex items-center gap-1">
        <Link
          to={editTo}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          title={t('stockReports.receiptEdit')}
          aria-label={t('stockReports.receiptEdit')}
        >
          <Pencil size={16} />
        </Link>
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          title={t('stockReports.receiptDelete')}
          aria-label={t('stockReports.receiptDelete')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </td>
  );
}
