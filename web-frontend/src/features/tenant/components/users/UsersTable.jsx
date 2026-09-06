import { CheckCircle2, Circle } from 'lucide-react';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
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
  companyById,
}) {
  const colSpan = isPlatform ? 12 : 8;

  const businessTypeLabel = (user) => {
    const company = companyById?.get?.(String(user.companyId ?? ''));
    const code = String(company?.businessType || 'UNIVERSAL').toUpperCase();
    const normalized = code === 'RETAIL' ? 'UNIVERSAL' : code;
    return t(`productTemplates.businessTypes.${normalized}`, normalized);
  };

  return (
    <div className="admin-table-shell">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
            <AdminTableNoIdHeaders />
            <th className="px-4 py-3 font-medium">{t('users.colUser')}</th>
            <th className="px-4 py-3 font-medium">{t('users.colUsername')}</th>
            {isPlatform && <th className="px-4 py-3 font-medium">{t('users.colCompanyCode')}</th>}
            {isPlatform && <th className="px-4 py-3 font-medium">{t('users.colCredentials')}</th>}
            {isPlatform && <th className="px-4 py-3 font-medium">{t('users.colCompany')}</th>}
            {isPlatform && <th className="px-4 py-3 font-medium">{t('platform.colBusinessType')}</th>}
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
                <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={user.id} />
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{user.username}</td>
                {isPlatform && (
                  <td className="px-4 py-3 font-mono text-xs tracking-wide text-slate-600 dark:text-slate-400">
                    {user.companyLoginCode
                      || companyById?.get?.(String(user.companyId ?? ''))?.loginCode
                      || '—'}
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
                {isPlatform && (
                  <td className="px-4 py-3">
                    {user.companyName
                      || companyById?.get?.(String(user.companyId ?? ''))?.name
                      || '—'}
                  </td>
                )}
                {isPlatform && (
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {businessTypeLabel(user)}
                  </td>
                )}
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
