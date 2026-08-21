import PlatformModuleAccessUserRow from './PlatformModuleAccessUserRow';

export default function PlatformModuleAccessUsersList({
  t,
  usersLoading,
  filteredUsers,
  selectedUserId,
  onSelectUser,
  selectedUserIds,
  onToggleUserSelection,
}) {
  return (
    <div className="module-access-panel__body max-h-[min(70vh,520px)] overflow-y-auto">
      {usersLoading ? (
        <p className="p-4 text-sm text-slate-500">{t('common.loading')}</p>
      ) : filteredUsers.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">{t('platform.noSearchResults')}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredUsers.map((u) => (
            <li key={u.userId} className="flex items-stretch">
              <label className="flex items-center px-3">
                <input
                  type="checkbox"
                  checked={selectedUserIds.has(u.userId)}
                  onChange={() => onToggleUserSelection(u.userId)}
                />
              </label>
              <PlatformModuleAccessUserRow
                t={t}
                user={u}
                selected={selectedUserId === u.userId}
                onSelect={onSelectUser}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
