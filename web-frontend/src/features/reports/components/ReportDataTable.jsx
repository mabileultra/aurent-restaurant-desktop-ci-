import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';

export default function ReportDataTable({
  rows,
  isPending,
  isError,
  error,
  t,
  columns,
  renderRow,
  emptyColSpan,
  page = 0,
  pageSize = 0,
  getRowId = (row) => row.id,
}) {
  const colSpan = (emptyColSpan ?? columns.length) + 2;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
          <tr>
            <AdminTableNoIdHeaders />
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isPending && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center">
                {t('common.loading')}
              </td>
            </tr>
          )}
          {isError && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-red-600">
                {error?.response?.data?.message ?? t('common.error')}
              </td>
            </tr>
          )}
          {!isPending && !isError && rows.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center">
                {t('common.noData')}
              </td>
            </tr>
          )}
          {rows.map((row, index) => {
            const cells = renderRow(row, index);
            return (
              <tr key={getRowId(row) ?? index} className="border-b border-slate-100 dark:border-slate-800">
                <AdminTableNoIdCells
                  page={page}
                  pageSize={pageSize || rows.length || 1}
                  index={index}
                  id={getRowId(row)}
                />
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
