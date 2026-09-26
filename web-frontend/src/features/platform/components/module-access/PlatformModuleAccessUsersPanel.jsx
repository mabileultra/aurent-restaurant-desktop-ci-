import PlatformModuleAccessUsersPanelHeader from './users/PlatformModuleAccessUsersPanelHeader';
import PlatformModuleAccessUsersList from './users/PlatformModuleAccessUsersList';
import PlatformModuleAccessUsersBulkFooter from './users/PlatformModuleAccessUsersBulkFooter';

export default function PlatformModuleAccessUsersPanel(props) {
  const {
    t,
    usersLoading,
    filteredUsers,
    listResetKey,
    unconfiguredCount,
    userFilter,
    onUserFilterChange,
    filterOptions,
    selectedUserId,
    onSelectUser,
    selectedUserIds,
    onToggleUserSelection,
    allFilteredSelected,
    onSelectAllFiltered,
    onBulkApply,
    bulkPending,
    bulkDisabled,
  } = props;

  return (
    <div className="module-access-panel admin-card">
      <PlatformModuleAccessUsersPanelHeader
        t={t}
        unconfiguredCount={unconfiguredCount}
        userFilter={userFilter}
        onUserFilterChange={onUserFilterChange}
        filterOptions={filterOptions}
        allFilteredSelected={allFilteredSelected}
        onSelectAllFiltered={onSelectAllFiltered}
        filteredCount={filteredUsers.length}
      />
      <PlatformModuleAccessUsersList
        t={t}
        usersLoading={usersLoading}
        filteredUsers={filteredUsers}
        listResetKey={listResetKey}
        selectedUserId={selectedUserId}
        onSelectUser={onSelectUser}
        selectedUserIds={selectedUserIds}
        onToggleUserSelection={onToggleUserSelection}
      />
      <PlatformModuleAccessUsersBulkFooter
        t={t}
        selectedCount={selectedUserIds.size}
        bulkPending={bulkPending}
        bulkDisabled={bulkDisabled}
        onBulkApply={onBulkApply}
      />
    </div>
  );
}
