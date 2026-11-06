import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AccessRightsHeader from '../components/access-rights/AccessRightsHeader';
import AccessRightsTemplatesTab from '../components/access-rights/templates/AccessRightsTemplatesTab';
import AccessRightsStaffTab from '../components/access-rights/staff/AccessRightsStaffTab';
import AccessRightsHistoryTab from '../components/access-rights/history/AccessRightsHistoryTab';
import AccessRightsCopyModal from '../components/access-rights/modals/AccessRightsCopyModal';
import AccessRightsCopyTemplateModal from '../components/access-rights/modals/AccessRightsCopyTemplateModal';
import { useAccessRightsV2Data } from '../components/access-rights/hooks/useAccessRightsV2Data';
import { platformModuleAccessApi } from '../../../api';

export default function PlatformModuleAccessPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'templates';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  useEffect(() => {
    const currentParam = searchParams.get('tab');
    if (currentParam && currentParam !== activeTab) {
      setActiveTab(currentParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
  };

  const {
    selectedBT, setSelectedBT,
    companies = [], businessTypes = [], roles = [],
    users = [], rawCatalog = [],
    isLoading = false, totalCount = 0, refetchAll,
  } = useAccessRightsV2Data() || {};

  // Copy permissions modal state
  const [copySourceUser, setCopySourceUser] = useState(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Copy template modal state
  const [isCopyTemplateOpen, setIsCopyTemplateOpen] = useState(false);

  // KPI counts
  const exceptionEmployees = users.filter((u) => Boolean(u.moduleAccessCustom || u.exceptionCount > 0)).length;
  const standardEmployees = Math.max(0, totalCount - exceptionEmployees);

  const handleOpenCopyStaff = (user) => {
    setCopySourceUser(user);
    setIsCopyModalOpen(true);
  };

  const handleConfirmCopyStaff = async ({ sourceUserId, targetUserIds, mode }) => {
    setIsCopying(true);
    try {
      await platformModuleAccessApi.copy({
        fromUserId: sourceUserId,
        targetUserIds,
        mode: mode === 'replace' ? 'OVERWRITE' : 'MERGE',
      });
      toast.success(`${targetUserIds.length} ta xodimga ruxsatlar muvaffaqiyatli nusxalandi`);
      setIsCopyModalOpen(false);
      refetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nusxalashda xatolik yuz berdi');
    } finally {
      setIsCopying(false);
    }
  };

  const [staffFilterBT, setStaffFilterBT] = useState('ALL');
  const [staffFilterRole, setStaffFilterRole] = useState('ALL');

  const handleSwitchToStaff = (btCode, roleCode) => {
    if (btCode) {
      setSelectedBT(btCode);
      setStaffFilterBT(btCode);
    }
    if (roleCode) {
      setStaffFilterRole(roleCode);
    }
    handleTabChange('staff');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      <AccessRightsHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        exceptionsCount={exceptionEmployees}
        isLoading={isLoading}
        onRefresh={refetchAll}
      />

      {activeTab === 'templates' && (
        <AccessRightsTemplatesTab
          businessTypes={businessTypes}
          roles={roles}
          rawCatalog={rawCatalog}
          totalEmployees={totalCount}
          standardEmployees={standardEmployees}
          exceptionEmployees={exceptionEmployees}
          selectedBT={selectedBT}
          onSelectBT={setSelectedBT}
          onSwitchToStaff={handleSwitchToStaff}
          onOpenCopyTemplate={() => setIsCopyTemplateOpen(true)}
        />
      )}

      {activeTab === 'staff' && (
        <AccessRightsStaffTab
          users={users}
          rawCatalog={rawCatalog}
          businessTypes={businessTypes}
          companies={companies}
          totalEmployees={totalCount}
          exceptionEmployees={exceptionEmployees}
          initialBT={staffFilterBT}
          initialRole={staffFilterRole}
          onOpenCopyModal={handleOpenCopyStaff}
          onStaffUpdated={refetchAll}
        />
      )}

      {activeTab === 'history' && (
        <AccessRightsHistoryTab onReverted={refetchAll} />
      )}

      {isCopyModalOpen && (
        <AccessRightsCopyModal
          open={isCopyModalOpen}
          isOpen={isCopyModalOpen}
          onClose={() => setIsCopyModalOpen(false)}
          sourceUser={copySourceUser}
          allUsers={users}
          onConfirmCopy={handleConfirmCopyStaff}
          isCopying={isCopying}
        />
      )}

      {isCopyTemplateOpen && (
        <AccessRightsCopyTemplateModal
          open={isCopyTemplateOpen}
          isOpen={isCopyTemplateOpen}
          onClose={() => setIsCopyTemplateOpen(false)}
          targetBT={selectedBT}
          businessTypes={businessTypes}
          onConfirm={() => {
            setIsCopyTemplateOpen(false);
            toast.success('Andoza nusxasi muvaffaqiyatli qo‘llandi');
            refetchAll();
          }}
        />
      )}
    </div>
  );
}
