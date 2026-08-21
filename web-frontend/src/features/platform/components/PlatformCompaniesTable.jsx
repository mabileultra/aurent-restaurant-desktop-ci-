import TableRowActionsMenu from '../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../components/shared/TablePagination';

export default function PlatformCompaniesTable({
  t,
  isPending,
  rows,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  menuId,
  onMenuOpenChange,
  onEdit,
  onDelete,
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
              <th className="w-14 px-4 py-3 font-medium">{t('platform.colNo')}</th>
              <th className="w-16 px-4 py-3 font-medium">{t('platform.colId')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colName')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colLoginCode')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colStores')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colBusinessType')}</th>
              <th className="px-4 py-3 font-medium">{t('common.status')}</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isPending ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 tabular-nums text-slate-500">
                    {page * pageSize + index + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {row.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs tracking-wide text-slate-600 dark:text-slate-400">
                    {row.loginCode || '—'}
                  </td>
                  <td className="px-4 py-3">{row.storeCount}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`)}
                  </td>
                  <td className="px-4 py-3">
                    {row.active ? t('common.active') : t('common.inactive')}
                  </td>
                  <td className="px-4 py-3">
                    <TableRowActionsMenu
                      open={menuId === row.id}
                      onOpenChange={(next) => onMenuOpenChange(next ? row.id : null)}
                      actions={[
                        { label: t('common.edit'), onClick: () => onEdit(row) },
                        {
                          label: t('common.delete'),
                          danger: true,
                          onClick: () => onDelete(row),
                        },
                      ]}
                    />
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
