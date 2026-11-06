import PlatformModuleAccessModulesPlaceholder from './modules/PlatformModuleAccessModulesPlaceholder';
import PlatformModuleAccessModulesHeader from './modules/PlatformModuleAccessModulesHeader';
import PlatformModuleAccessModulesBody from './modules/PlatformModuleAccessModulesBody';
import PlatformModuleAccessModulesFooter from './modules/PlatformModuleAccessModulesFooter';

export default function PlatformModuleAccessModulesPanel({
  t,
  selectedUserId,
  selectedUser,
  detail,
  detailLoading,
  customAccess,
  onCustomAccessChange,
  groupedModules,
  moduleToggles,
  onToggleModule,
  onSetAllModules,
  onSave,
  onReset,
  isSaving,
  resetPending,
  businessTypeCode,
}) {
  if (!selectedUserId) {
    return <PlatformModuleAccessModulesPlaceholder message={t('platform.moduleAccess.pickUser')} />;
  }

  if (detailLoading) {
    return <PlatformModuleAccessModulesPlaceholder message={t('common.loading')} />;
  }

  const businessTypeLabel = businessTypeCode
    ? t(`productTemplates.businessTypes.${businessTypeCode}`, businessTypeCode)
    : '';
  const companyName = selectedUser?.companyName
    || (detail.role === 'PLATFORM_ADMIN' ? t('platform.moduleAccess.platformStaff') : '');

  return (
    <div className="module-access-panel admin-card">
      <PlatformModuleAccessModulesHeader
        t={t}
        fullName={selectedUser?.fullName}
        role={detail.role}
        companyName={companyName}
        businessTypeLabel={businessTypeLabel}
        customAccess={customAccess}
        onCustomAccessChange={onCustomAccessChange}
        onSetAllModules={onSetAllModules}
      />
      <PlatformModuleAccessModulesBody
        t={t}
        groupedModules={groupedModules}
        moduleToggles={moduleToggles}
        onToggleModule={onToggleModule}
        onSetAllModules={onSetAllModules}
      />
      <PlatformModuleAccessModulesFooter
        t={t}
        onReset={onReset}
        onSave={onSave}
        isSaving={isSaving}
        resetPending={resetPending}
      />
    </div>
  );
}
