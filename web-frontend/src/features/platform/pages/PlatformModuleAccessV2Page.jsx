import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import BusinessTypePills from '../components/access-rights/cards/BusinessTypePills';
import RoleCardsGrid from '../components/access-rights/cards/RoleCardsGrid';
import SearchResultsSection from '../components/access-rights/cards/SearchResultsSection';
import RoleTemplateDrawer from '../components/access-rights/cards/RoleTemplateDrawer';
import RoleEmployeesDrawer from '../components/access-rights/cards/RoleEmployeesDrawer';
import RoleEmployeeEditDrawer from '../components/access-rights/cards/RoleEmployeeEditDrawer';
import RoleEmployeeResetConfirmDialog from '../components/access-rights/cards/RoleEmployeeResetConfirmDialog';
import PlatformModuleAccessV2Header from '../components/access-rights/cards/PlatformModuleAccessV2Header';
import PlatformModuleAccessToolbar from '../components/access-rights/cards/PlatformModuleAccessToolbar';
import { useAccessRightsV2Data } from '../components/access-rights/hooks/useAccessRightsV2Data';

export default function PlatformModuleAccessV2Page() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language === 'ru' ? 'ru' : 'uz';

  const {
    selectedBT, setSelectedBT, selectedCompanyId = '', setSelectedCompanyId,
    searchTerm = '', setSearchTerm, accessFilter = 'all', setAccessFilter,
    unconfiguredCount = 0, isPlatformStaff = false,
    companies = [], companiesLoading = false, businessTypes = [],
    roles = [], rawUsers = [], rawCatalog = [], moduleGroups = [], catalogMap = {},
    isLoading = false, isError = false, error = null,
    isTruncated = false, totalCount = 0, refetchAll, handleResetUser,
  } = useAccessRightsV2Data() || {};

  const [configuringRole, setConfiguringRole] = useState(null);
  const [viewingRoleEmployees, setViewingRoleEmployees] = useState(null);
  const [editingSearchUser, setEditingSearchUser] = useState(null);
  const [confirmResetUser, setConfirmResetUser] = useState(null);
  const [isResettingSearchUser, setIsResettingSearchUser] = useState(false);

  const currentBT = businessTypes.find((b) => b.code === selectedBT) || businessTypes[0] || { name: selectedBT };
  const hasActiveEmployees = roles.some((r) => r.totalEmployees > 0);
  const activeRoles = hasActiveEmployees ? roles.filter((r) => r.totalEmployees > 0) : roles;
  const emptyRoles = hasActiveEmployees ? roles.filter((r) => r.totalEmployees === 0) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      <PlatformModuleAccessV2Header
        currentLang={currentLang} isLoading={isLoading} isError={isError} error={error} onRetry={refetchAll}
      />

      <BusinessTypePills businessTypes={businessTypes} selectedCode={selectedBT} onSelect={setSelectedBT} />

      <PlatformModuleAccessToolbar
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        accessFilter={accessFilter} setAccessFilter={setAccessFilter}
        unconfiguredCount={unconfiguredCount} isPlatformStaff={isPlatformStaff}
        companies={companies} companiesLoading={companiesLoading}
        selectedCompanyId={selectedCompanyId} setSelectedCompanyId={setSelectedCompanyId}
        currentLang={currentLang} isTruncated={isTruncated}
        totalCount={totalCount} loadedCount={rawUsers.length}
      />

      {searchTerm ? (
        <SearchResultsSection
          searchTerm={searchTerm}
          users={rawUsers}
          currentLang={currentLang}
          onEditUser={(u) => setEditingSearchUser(u)}
          onResetUser={(u) => setConfirmResetUser(u)}
        />
      ) : (
        <RoleCardsGrid
          activeRoles={activeRoles}
          emptyRoles={emptyRoles}
          onConfigureRole={setConfiguringRole}
          onViewEmployees={setViewingRoleEmployees}
          currentLang={currentLang}
        />
      )}

      <div className="pt-2 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            toast(
              currentLang === 'ru'
                ? 'История изменений и журнал аудита скоро появятся'
                : 'O‘zgarishlar tarixi va audit jurnali tez kunda taqdim etiladi',
              { icon: 'ℹ️' }
            );
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>{currentLang === 'ru' ? 'История изменений' : 'O‘zgarishlar tarixi'}</span>
        </button>
        <span className="rounded-md bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 font-bold dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
          {currentLang === 'ru' ? 'Скоро' : 'Tez kunda'}
        </span>
      </div>

      <RoleTemplateDrawer
        isOpen={Boolean(configuringRole)}
        onClose={() => setConfiguringRole(null)}
        role={configuringRole}
        businessType={selectedBT}
        businessTypeName={currentBT.name}
        moduleGroups={moduleGroups}
        onSaved={refetchAll}
      />

      <RoleEmployeesDrawer
        isOpen={Boolean(viewingRoleEmployees)}
        onClose={() => setViewingRoleEmployees(null)}
        role={viewingRoleEmployees}
        businessType={selectedBT}
        businessTypeName={currentBT.name}
        users={rawUsers}
        catalogMap={catalogMap}
        rawCatalog={rawCatalog}
        onResetUserToTemplate={handleResetUser}
        onUserUpdated={refetchAll}
      />

      <RoleEmployeeEditDrawer
        isOpen={Boolean(editingSearchUser)}
        onClose={() => setEditingSearchUser(null)}
        user={editingSearchUser}
        businessType={editingSearchUser?.businessType || selectedBT}
        businessTypeName={editingSearchUser?.businessTypeName || currentBT.name}
        rawCatalog={rawCatalog}
        onSaved={refetchAll}
      />

      <RoleEmployeeResetConfirmDialog
        user={confirmResetUser}
        isResetting={isResettingSearchUser}
        onCancel={() => !isResettingSearchUser && setConfirmResetUser(null)}
        onConfirm={async () => {
          if (confirmResetUser) {
            setIsResettingSearchUser(true);
            try {
              await handleResetUser(confirmResetUser.userId || confirmResetUser.id);
              setConfirmResetUser(null);
            } finally {
              setIsResettingSearchUser(false);
            }
          }
        }}
      />
    </div>
  );
}
