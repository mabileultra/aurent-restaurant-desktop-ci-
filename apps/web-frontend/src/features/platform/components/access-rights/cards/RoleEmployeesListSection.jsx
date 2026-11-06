import React from 'react';
import RoleEmployeeListItem from './RoleEmployeeListItem';

/**
 * Xodimlar ro'yxati panelidagi xodimlar kartochkalari bloki (SRP)
 */
export default function RoleEmployeesListSection({
  filteredUsers = [],
  businessTypeName,
  selectedUserIds = new Set(),
  onToggleSelect,
  onEditClick,
  onResetClick,
}) {
  if (filteredUsers.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-12 text-center text-xs text-slate-500 dark:text-slate-400">
        Ushbu filtr bo‘yicha xodim topilmadi
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
      {filteredUsers.map((u) => {
        const uId = u.userId || u.id;
        return (
          <RoleEmployeeListItem
            key={uId}
            user={u}
            businessTypeName={businessTypeName}
            isSelected={selectedUserIds.has(uId)}
            onToggleSelect={onToggleSelect}
            onEditClick={onEditClick}
            onResetClick={onResetClick}
          />
        );
      })}
    </div>
  );
}
