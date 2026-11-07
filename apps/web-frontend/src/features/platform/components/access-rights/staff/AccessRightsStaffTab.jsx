import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AccessRightsStaffFiltersBar from './AccessRightsStaffFiltersBar';
import AccessRightsStaffListPanel from './AccessRightsStaffListPanel';
import AccessRightsStaffDetailPanel from './AccessRightsStaffDetailPanel';
import { useAccessRightsStaffFlow } from '../hooks/useAccessRightsStaffFlow';
import { isNewStaffUser } from '../hooks/staffFlowHelpers';
import {
  resolveModuleName,
  GROUP_TITLES_UZ,
  GROUP_TITLES_RU,
} from '../utils/accessRightsCatalogUtils';

export default function AccessRightsStaffTab({
  users = [],
  rawCatalog = [],
  businessTypes = [],
  companies = [],
  totalEmployees = 0,
  exceptionEmployees = 0,
  selectedBT = 'ALL',
  onSelectBT,
  selectedCompanyId = '',
  onSelectCompanyId,
  selectedRole = 'ALL',
  onSelectRole,
  searchTerm = '',
  onSearchChange,
  onOpenCopyModal,
  onStaffUpdated,
  onDirtyChange,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'custom' | 'new'

  const roleFilteredUsers = useMemo(() => {
    if (!selectedRole || selectedRole === 'ALL') return users;
    return users.filter((u) => u.role === selectedRole);
  }, [users, selectedRole]);

  const newCount = useMemo(() => {
    return roleFilteredUsers.filter((u) => isNewStaffUser(u.createdAt)).length;
  }, [roleFilteredUsers]);

  const realExceptionsCount = useMemo(() => {
    return roleFilteredUsers.filter((u) => Boolean(u.moduleAccessCustom || u.exceptionCount > 0)).length;
  }, [roleFilteredUsers]);

  // Client-side quick filter for chips (custom, new)
  const filteredUsers = useMemo(() => {
    return roleFilteredUsers.filter((u) => {
      if (filterTab === 'custom') {
        const hasEx = Boolean(u.moduleAccessCustom || u.exceptionCount > 0);
        if (!hasEx) return false;
      }
      if (filterTab === 'new') {
        if (!isNewStaffUser(u.createdAt)) return false;
      }
      return true;
    });
  }, [roleFilteredUsers, filterTab]);

  const flow = useAccessRightsStaffFlow({
    users: filteredUsers,
    rawCatalog,
    onStaffUpdated,
  });

  React.useEffect(() => {
    if (onDirtyChange) onDirtyChange(flow.isDirty);
  }, [flow.isDirty, onDirtyChange]);

  // Map user-scoped modules with names and group titles
  const userModulesWithMeta = useMemo(() => {
    const titles = isRu ? GROUP_TITLES_RU : GROUP_TITLES_UZ;
    return (flow.userModules || []).map((m) => {
      const cat = rawCatalog.find((c) => c.id === m.id);
      const groupId = cat?.group || 'main';
      return {
        ...m,
        name: resolveModuleName(m.id, {}, isRu ? 'ru' : 'uz'),
        groupTitle: titles[groupId] || (isRu ? 'Основной' : 'Asosiy'),
      };
    });
  }, [flow.userModules, rawCatalog, isRu]);

  const handleBulkCopy = () => {
    if (!onOpenCopyModal) return;
    const targets = Array.from(flow.checkedIds);
    onOpenCopyModal(flow.selectedUser, targets);
  };

  const handleSelectUser = (user) => {
    flow.setSelectedUser(user);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        const el = document.getElementById('staff-detail-panel');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top filters bar */}
      <AccessRightsStaffFiltersBar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        businessTypes={businessTypes}
        selectedBT={selectedBT}
        onSelectBT={onSelectBT}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompanyId={onSelectCompanyId}
        selectedRole={selectedRole}
        onSelectRole={onSelectRole}
      />

      {/* 2-Column Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        <AccessRightsStaffListPanel
          users={filteredUsers}
          totalCount={users.length}
          filterTab={filterTab}
          onFilterTabChange={setFilterTab}
          exceptionsCount={realExceptionsCount}
          newCount={newCount}
          selectedUserId={flow.selectedUserId}
          onSelectUser={handleSelectUser}
          checkedUserIds={flow.checkedIds}
          onToggleCheckUser={flow.handleToggleCheckUser}
          onToggleCheckAll={flow.handleToggleCheckAll}
          onResetBulk={flow.handleBulkReset}
          onCopyBulk={handleBulkCopy}
          onClearChecked={flow.handleClearChecked}
          isResettingBulk={flow.isResettingBulk}
        />

        <AccessRightsStaffDetailPanel
          user={flow.selectedUser}
          totalUsersCount={filteredUsers.length}
          templateModules={flow.templateModules}
          moduleOverrides={flow.overrides}
          allModules={userModulesWithMeta}
          isDirty={flow.isDirty}
          dirtyCount={flow.dirtyCount}
          isSaving={flow.isSaving}
          onChangeOverride={flow.handleChangeOverride}
          onResetUserToTemplate={() => flow.handleResetUser(flow.selectedUserId)}
          onOpenCopyModal={() => onOpenCopyModal && onOpenCopyModal(flow.selectedUser)}
          onCancel={flow.handleCancel}
          onSave={flow.handleSave}
        />
      </div>
    </div>
  );
}
