import { CheckCircle2, Circle } from 'lucide-react';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../../components/shared/TablePagination';
import { USER_ROLE_BADGE } from '../../constants';
import { canDeleteUser } from '../../utils/userDeletePolicy';

export default function UsersTable({
  t,
  isPlatform,
  isLoading,
  pageRows,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  menuId,
  onMenuOpenChange,
  onEdit,
  onToggleActive,
  onDelete,
  actorRole,
}) {
  const colSpan = isPlatform ? 11 : 8;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
            <th className="w-14 px-4 py-3 font-medium">{t('platform.colNo')}</th>
            <th className="w-16 px-4 py-3 font-medium">{t('platform.colId')}</th>
            <th className="px-4 py-3 font-medium">{t('users.colUser')}</th>
            <th className="px-4 py-3 font-medium">{t('users.colUsername')}</th>
            {isPlatform && <th className="px-4 py-3 font-medium">{t('users.colCompanyCode')}</th>}
            {isPlatform && <th className="px-4 py-3 font-medium">{t('users.colCredentials')}</th>}
            {isPlatform && <th className="px-4 py-3 font-medium">{t('users.colCompany')}</th>}
            <th className="px-4 py-3 font-medium">{t('users.colStores')}</th>
            <th className="px-4 py-3 font-medium">{t('users.colRole')}</th>
            <th className="px-4 py-3 font-medium">{t('users.colActive')}</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {isLoading ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                {t('common.loading')}
              </td>
            </tr>
          ) : pageRows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                {t('platform.noSearchResults')}
              </td>
            </tr>
          ) : (
            pageRows.map((user, index) => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 tabular-nums text-slate-500">
                  {page * pageSize + index + 1}
                </td>
                <td
                  className="max-w-[7.5rem] truncate px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400"
                  title={String(user.id)}
                >
                  {user.id}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{user.username}</td>
                {isPlatform && (
                  <td className="px-4 py-3 font-mono text-xs tracking-wide text-slate-600 dark:text-slate-400">
                    {user.companyLoginCode || '—'}
                  </td>
                )}
                {isPlatform && (
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-mono">{user.username}</span>
                    <span className="mx-1">·</span>
                    <span className="text-slate-400">
                      {user.role === 'CASHIER'
                        ? t('users.credentialsPinHidden')
                        : t('users.credentialsPasswordHidden')}
                    </span>
                  </td>
                )}
                {isPlatform && <td className="px-4 py-3">{user.companyName || '—'}</td>}
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                  {user.storeNames?.length ? user.storeNames.join(', ') : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${USER_ROLE_BADGE[user.role] ?? ''}`}
                  >
                    {t(`roles.${user.role}`, user.role)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.active ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <Circle size={18} className="text-slate-400" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <TableRowActionsMenu
                    open={menuId === user.id}
                    onOpenChange={(next) => onMenuOpenChange(next ? user.id : null)}
                    actions={[
                      { label: t('common.edit'), onClick: () => onEdit(user) },
                      {
                        label: user.active ? t('users.deactivate') : t('users.activate'),
                        onClick: () => onToggleActive(user.id),
                      },
                      ...(canDeleteUser(actorRole, user.role)
                        ? [{
                            label: t('common.delete'),
                            onClick: () => onDelete(user),
                            danger: true,
                          }]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
