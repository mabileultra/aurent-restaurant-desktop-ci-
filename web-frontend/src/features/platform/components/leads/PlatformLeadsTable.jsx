import TablePagination from '../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';

function formatLeadDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200';
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200';
    case 'DONE':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
  }
}

export default function PlatformLeadsTable({
  t,
  isPending,
  rows,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onOpen,
}) {
  const safeTotalPages = Math.max(
    totalPages || 0,
    pageSize > 0 && total > 0 ? Math.ceil(total / pageSize) : 1
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3 font-medium">{t('platform.leads.colDate')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.leads.colName')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.leads.colPhone')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.leads.colEmail')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.leads.colType')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.leads.colSource')}</th>
              <th className="px-4 py-3 font-medium">{t('common.status')}</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isPending ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  onClick={() => onOpen(row)}
                >
                  <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={row.id} />
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                    {formatLeadDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.phone}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.email || '—'}</td>
                  <td className="px-4 py-3">{t(`platform.leads.types.${row.leadType}`)}</td>
                  <td className="px-4 py-3">{t(`platform.leads.sources.${row.source}`, row.source)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}>
                      {t(`platform.leads.statuses.${row.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(row);
                      }}
                    >
                      {t('common.view')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={safeTotalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
