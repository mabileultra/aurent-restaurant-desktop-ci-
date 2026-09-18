import { isNewModuleAccessUser } from '../../../utils/moduleAccessUserFilters';
import { isPlatformAdminRole } from '../../../../../utils/platformRoles';
import '../../../../../styles/platform/module-access-users.css';

export default function PlatformModuleAccessUserRow({
  t,
  user,
  selected,
  onSelect,
}) {
  const isNew = isNewModuleAccessUser(user);

  return (
    <button
      type="button"
      onClick={() => onSelect(user.userId)}
      className={`module-access-user-row flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
        selected ? 'module-access-user-row--selected' : ''
      }`}
    >
      <span className="module-access-user-row__title font-medium text-slate-900 dark:text-white">
        <span>{user.fullName}</span>
        {isNew ? (
          <span className="module-access-user-row__new">{t('platform.moduleAccess.newBadge')}</span>
        ) : null}
      </span>
      <span className="text-xs text-slate-500">
        {user.username} · {t(`roles.${user.role}`, user.role)}
        {user.moduleAccessCustom ? (
          <span className="module-access-user-row__badge rounded bg-violet-100 px-1.5 py-0.5 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
            {t('platform.moduleAccess.customBadge')}
          </span>
        ) : null}
      </span>
      {user.companyName ? (
        <span className="module-access-user-row__company">{user.companyName}</span>
      ) : isPlatformAdminRole(user.role) ? (
        <span className="module-access-user-row__company">{t('platform.moduleAccess.platformStaff')}</span>
      ) : null}
    </button>
  );
}
