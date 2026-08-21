export default function PlatformModuleAccessUsersFilterChips({
  userFilter,
  onUserFilterChange,
  filterOptions,
}) {
  return (
    <div className="module-access-filters mt-2 flex flex-wrap gap-1">
      {filterOptions.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onUserFilterChange(key)}
          className={`module-access-filters__chip rounded-full px-2.5 py-1 text-xs font-medium ${
            userFilter === key ? 'module-access-filters__chip--active' : ''
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
