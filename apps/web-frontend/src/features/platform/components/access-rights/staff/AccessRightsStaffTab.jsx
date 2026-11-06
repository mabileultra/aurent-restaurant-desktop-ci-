import React, { useState, useMemo } from 'react';
import AccessRightsStaffFiltersBar from './AccessRightsStaffFiltersBar';
import AccessRightsStaffListPanel from './AccessRightsStaffListPanel';
import AccessRightsStaffDetailPanel from './AccessRightsStaffDetailPanel';
import { useAccessRightsStaffFlow } from '../hooks/useAccessRightsStaffFlow';

export default function AccessRightsStaffTab({
  users = [],
  rawCatalog = [],
  businessTypes = [],
  companies = [],
  totalEmployees = 0,
  exceptionEmployees = 0,
  initialBT = 'ALL',
  initialRole = 'ALL',
  onOpenCopyModal,
  onStaffUpdated,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBT, setSelectedBT] = useState(initialBT);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'custom' | 'new'

  React.useEffect(() => {
    if (initialBT) setSelectedBT(initialBT);
  }, [initialBT]);

  React.useEffect(() => {
    if (initialRole) setSelectedRole(initialRole);
  }, [initialRole]);

  // Filter users based on top bar filters
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedBT !== 'ALL' && u.businessType !== selectedBT) return false;
      if (selectedCompanyId && String(u.companyId) !== String(selectedCompanyId)) return false;
      if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = (u.fullName || '').toLowerCase().includes(query);
        const matchesUser = (u.username || '').toLowerCase().includes(query);
        const matchesComp = (u.companyName || '').toLowerCase().includes(query);
        if (!matchesName && !matchesUser && !matchesComp) return false;
      }

      if (filterTab === 'custom') {
        const hasEx = Boolean(u.moduleAccessCustom || u.exceptionCount > 0);
        if (!hasEx) return false;
      }

      return true;
    });
  }, [users, selectedBT, selectedCompanyId, selectedRole, searchTerm, filterTab]);

  const flow = useAccessRightsStaffFlow({
    users: filteredUsers,
    rawCatalog,
    onStaffUpdated,
  });

  return (
    <div className="space-y-4">
      {/* Top filters bar */}
      <AccessRightsStaffFiltersBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        businessTypes={businessTypes}
        selectedBT={selectedBT}
        onSelectBT={setSelectedBT}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompanyId={setSelectedCompanyId}
        selectedRole={selectedRole}
        onSelectRole={setSelectedRole}
      />

      {/* 2-Column Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        <AccessRightsStaffListPanel
          users={filteredUsers}
          totalCount={users.length}
          filterTab={filterTab}
          onFilterTabChange={setFilterTab}
          exceptionsCount={exceptionEmployees}
          newCount={Math.max(0, Math.round(users.length * 0.1))}
          selectedUserId={flow.selectedUserId}
          onSelectUser={flow.setSelectedUser}
          checkedUserIds={flow.checkedIds}
          onToggleCheckUser={flow.handleToggleCheckUser}
          onToggleCheckAll={flow.handleToggleCheckAll}
          onResetBulk={flow.handleBulkReset}
          onCopyBulk={() => onOpenCopyModal && onOpenCopyModal(flow.selectedUser)}
          onClearChecked={flow.handleClearChecked}
          isResettingBulk={flow.isResettingBulk}
        />

        <AccessRightsStaffDetailPanel
          user={flow.selectedUser}
          templateModules={flow.templateModules}
          moduleOverrides={flow.overrides}
          allModules={rawCatalog}
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
