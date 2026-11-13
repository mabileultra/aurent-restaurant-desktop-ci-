import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AccessRightsHeader from '../components/access-rights/AccessRightsHeader';
import AccessRightsTemplatesTab from '../components/access-rights/templates/AccessRightsTemplatesTab';
import AccessRightsStaffTab from '../components/access-rights/staff/AccessRightsStaffTab';
import AccessRightsHistoryTab from '../components/access-rights/history/AccessRightsHistoryTab';
import AccessRightsCopyModal from '../components/access-rights/modals/AccessRightsCopyModal';
import AccessRightsCopyTemplateModal from '../components/access-rights/modals/AccessRightsCopyTemplateModal';
import { useAccessRightsV2Data } from '../components/access-rights/hooks/useAccessRightsV2Data';
import { useAccessRightsCopyActions } from '../components/access-rights/hooks/useAccessRightsCopyActions';

export default function PlatformModuleAccessPage() {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'templates';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedTemplateRole, setSelectedTemplateRole] = useState('ADMIN');
  const [isTabDirty, setIsTabDirty] = useState(false);

  useEffect(() => {
    const currentParam = searchParams.get('tab');
    if (currentParam && currentParam !== activeTab) {
      setActiveTab(currentParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    if (isTabDirty) {
      const confirmMsg = isRu
        ? 'У вас есть несохранённые изменения. Перейти на другую вкладку без сохранения?'
        : 'Sizda saqlanmagan o‘zgarishlar bor. Saqlamasdan boshqa bo‘limga o‘tishni xohlaysizmi?';
      if (!window.confirm(confirmMsg)) return;
    }
    setIsTabDirty(false);
    setActiveTab(tabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
  };

  const {
    selectedBT, setSelectedBT,
    selectedCompanyId, setSelectedCompanyId,
    selectedRole, setSelectedRole,
    searchTerm, setSearchTerm,
    companies = [], businessTypes = [],
    users = [], rawCatalog = [], statsByCode = new Map(),
    networkStats = {}, isLoading = false, totalCount = 0, refetchAll,
  } = useAccessRightsV2Data() || {};

  const copyActions = useAccessRightsCopyActions({ refetchAll, isRu });

  const {
    totalEmployees = totalCount,
    standardEmployees = totalCount,
    exceptionEmployees = 0,
    businessTypesCount = 0,
  } = networkStats || {};

  const handleSwitchToStaff = (btCode, roleCode) => {
    if (btCode) setSelectedBT(btCode);
    if (roleCode) setSelectedRole(roleCode);
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
          rawCatalog={rawCatalog}
          statsByCode={statsByCode}
          selectedBT={selectedBT}
          initialRole={selectedTemplateRole}
          onSelectRole={setSelectedTemplateRole}
          onSelectBT={setSelectedBT}
          onSwitchToStaff={handleSwitchToStaff}
          onOpenCopyTemplate={(bt, role) => copyActions.handleOpenCopyTemplate(bt || selectedBT, role || selectedTemplateRole)}
          onDirtyChange={setIsTabDirty}
        />
      )}

      {activeTab === 'staff' && (
        <AccessRightsStaffTab
          users={users}
          rawCatalog={rawCatalog}
          businessTypes={businessTypes}
          companies={companies}
          totalEmployees={totalEmployees}
          exceptionEmployees={exceptionEmployees}
          selectedBT={selectedBT}
          onSelectBT={setSelectedBT}
          selectedCompanyId={selectedCompanyId}
          onSelectCompanyId={setSelectedCompanyId}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenCopyModal={copyActions.handleOpenCopyStaff}
          onStaffUpdated={refetchAll}
          onDirtyChange={setIsTabDirty}
        />
      )}

      {activeTab === 'history' && (
        <AccessRightsHistoryTab onReverted={refetchAll} />
      )}

      {copyActions.isCopyModalOpen && (
        <AccessRightsCopyModal
          open={copyActions.isCopyModalOpen}
          isOpen={copyActions.isCopyModalOpen}
          onClose={() => copyActions.setIsCopyModalOpen(false)}
          sourceUser={copyActions.copySourceUser}
          initialTargetIds={copyActions.copyInitialTargets}
          allUsers={users}
          onConfirmCopy={copyActions.handleConfirmCopyStaff}
          isCopying={copyActions.isCopying}
        />
      )}

      {copyActions.isCopyTemplateOpen && (
        <AccessRightsCopyTemplateModal
          open={copyActions.isCopyTemplateOpen}
          isOpen={copyActions.isCopyTemplateOpen}
          onClose={() => copyActions.setIsCopyTemplateOpen(false)}
          targetBT={copyActions.copyTemplateTarget?.targetBT || selectedBT}
          targetRole={copyActions.copyTemplateTarget?.targetRole || selectedTemplateRole || 'ADMIN'}
          businessTypes={businessTypes}
          onConfirm={copyActions.handleConfirmCopyTemplate}
          isLoading={copyActions.isCopyingTemplate}
        />
      )}
    </div>
  );
}
