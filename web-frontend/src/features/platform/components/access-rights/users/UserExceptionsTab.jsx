import React, { useState } from 'react';
import toast from 'react-hot-toast';
import UserExceptionsList from './UserExceptionsList';
import UserExceptionsDetail from './UserExceptionsDetail';
import UserExceptionsBulkBar from './UserExceptionsBulkBar';
import CopyPermissionsModal from '../modals/CopyPermissionsModal';
import { MOCK_USERS_DATA } from '../mock/accessRightsUsersData';

export default function UserExceptionsTab() {
  const [users, setUsers] = useState(MOCK_USERS_DATA);
  const [selectedUserId, setSelectedUserId] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState(() => new Set());
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  const handleToggleUserCheck = (id) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = (visibleUsers) => {
    setSelectedUserIds((prev) => {
      const allSelected = visibleUsers.every((u) => prev.has(u.id));
      const next = new Set(prev);
      if (allSelected) {
        visibleUsers.forEach((u) => next.delete(u.id));
      } else {
        visibleUsers.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  const handleResetToTemplate = (userId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, hasExceptions: false, exceptionCount: 0, grantedModules: [], deniedModules: [] }
          : u
      )
    );
    toast.success('Xodim huquqlari rol shabloniga qaytarildi');
  };

  const handleBulkReset = () => {
    setUsers((prev) =>
      prev.map((u) =>
        selectedUserIds.has(u.id)
          ? { ...u, hasExceptions: false, exceptionCount: 0, grantedModules: [], deniedModules: [] }
          : u
      )
    );
    toast.success(`${selectedUserIds.size} ta xodim shablonga qaytarildi`);
    setSelectedUserIds(new Set());
  };

  const handleSaveOverrides = (userId, overrides) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              hasExceptions: overrides.grantedModules.length > 0 || overrides.deniedModules.length > 0,
              exceptionCount: overrides.grantedModules.length + overrides.deniedModules.length,
              grantedModules: overrides.grantedModules,
              deniedModules: overrides.deniedModules,
            }
          : u
      )
    );
  };

  return (
    <div className="space-y-4">
      <UserExceptionsBulkBar
        selectedCount={selectedUserIds.size}
        onResetToTemplate={handleBulkReset}
        onCopyPermissions={() => setIsCopyModalOpen(true)}
        onClearSelection={() => setSelectedUserIds(new Set())}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">
        <UserExceptionsList
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
          selectedUserIds={selectedUserIds}
          onToggleUserCheck={handleToggleUserCheck}
          onSelectAllVisible={handleSelectAllVisible}
        />

        <UserExceptionsDetail
          key={selectedUser.id}
          user={selectedUser}
          onResetToTemplate={() => handleResetToTemplate(selectedUser.id)}
          onOpenCopyModal={() => setIsCopyModalOpen(true)}
          onSaveOverrides={handleSaveOverrides}
        />
      </div>

      <CopyPermissionsModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        sourceUser={selectedUser}
        allUsers={users}
      />
    </div>
  );
}
