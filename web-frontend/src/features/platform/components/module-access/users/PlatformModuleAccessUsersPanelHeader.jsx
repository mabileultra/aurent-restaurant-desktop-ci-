import PlatformModuleAccessUsersFilterChips from './PlatformModuleAccessUsersFilterChips';

export default function PlatformModuleAccessUsersPanelHeader({
  t,
  unconfiguredCount,
  userFilter,
  onUserFilterChange,
  filterOptions,
  allFilteredSelected,
  onSelectAllFiltered,
  filteredCount,
}) {
  return (
    <div className="module-access-panel__header border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{t('platform.moduleAccess.users')}</span>
        {unconfiguredCount > 0 ? (
          <span className="module-access-panel__badge rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
            {t('platform.moduleAccess.unconfiguredCount', { count: unconfiguredCount })}
          </span>
        ) : null}
      </div>
      <PlatformModuleAccessUsersFilterChips
        userFilter={userFilter}
        onUserFilterChange={onUserFilterChange}
        filterOptions={filterOptions}
      />
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={(e) => onSelectAllFiltered(e.target.checked)}
        />
        {t('platform.moduleAccess.selectAllVisible', { count: filteredCount })}
      </label>
    </div>
  );
}
