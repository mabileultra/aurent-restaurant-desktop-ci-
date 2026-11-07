import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AccessRightsTemplatesKPIs from './AccessRightsTemplatesKPIs';
import AccessRightsTemplatesSidebar from './AccessRightsTemplatesSidebar';
import AccessRightsTemplateEditor from './AccessRightsTemplateEditor';
import { useAccessRightsTemplatesFlow } from '../hooks/useAccessRightsTemplatesFlow';
import { resolveRoleLabel, resolveBusinessTypeName } from '../utils/accessRightsCatalogUtils';
import { rolesForBusinessType } from '../../../utils/rolesByBusinessType';
import { getScopeForRole, getDefaultModulesForRole } from '../utils/roleDefaultModules';

export default function AccessRightsTemplatesTab({
  businessTypes = [],
  rawCatalog = [],
  statsByCode = new Map(),
  totalEmployees = 0,
  standardEmployees = 0,
  exceptionEmployees = 0,
  businessTypesCount = 0,
  selectedBT = 'RESTAURANT',
  initialRole = 'ADMIN',
  onSelectBT,
  onSelectRole,
  onSwitchToStaff,
  onOpenCopyTemplate,
  onDirtyChange,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const flow = useAccessRightsTemplatesFlow({
    businessTypes,
    rawCatalog,
    selectedBT,
    initialRole,
    onSelectBT,
    onSwitchToStaff,
  });

  React.useEffect(() => {
    if (onDirtyChange) onDirtyChange(flow.isDirty);
  }, [flow.isDirty, onDirtyChange]);

  // Build groupedTemplates with REAL backend stats and accurate scopes
  const groupedTemplates = useMemo(() => {
    return businessTypes
      .filter((bt) => bt.code !== 'ALL')
      .map((bt) => {
        const btStats = statsByCode.get(String(bt.code || '').toUpperCase());
        const totalEmp = btStats?.totalEmployees ?? bt.totalEmployees ?? 0;
        const allowedRoles = rolesForBusinessType(bt.code);

        const rolesList = allowedRoles.map((roleCode) => {
          const roleStats = btStats?.roleMap?.get(roleCode.toUpperCase());
          const roleTotal = roleStats ? Number(roleStats.totalEmployees || 0) : 0;
          const roleExceptions = roleStats ? Number(roleStats.exceptionCount || 0) : 0;

          const scope = getScopeForRole(roleCode, bt.code);
          const defaultMods = getDefaultModulesForRole(roleCode, bt.code);

          const isCurrent = bt.code === selectedBT && roleCode === flow.currentRole;
          const enabledCount = isCurrent
            ? Object.values(flow.toggles).filter(Boolean).length
            : defaultMods.size;

          return {
            code: roleCode,
            name: resolveRoleLabel(roleCode, isRu ? 'ru' : 'uz'),
            totalEmployees: roleTotal,
            exceptionCount: roleExceptions,
            enabledModulesCount: enabledCount,
            totalModulesCount: scope.size,
          };
        });

        return {
          code: bt.code,
          name: bt.name,
          totalEmployees: totalEmp,
          roles: rolesList,
        };
      });
  }, [businessTypes, statsByCode, selectedBT, flow.currentRole, flow.toggles, isRu]);

  const currentRoleStats = statsByCode.get(String(selectedBT || '').toUpperCase())?.roleMap?.get(flow.currentRole);
  const currentRoleEmployees = currentRoleStats ? Number(currentRoleStats.totalEmployees || 0) : 0;
  const currentRoleExceptions = currentRoleStats ? Number(currentRoleStats.exceptionCount || 0) : 0;

  const currentBTName = resolveBusinessTypeName(selectedBT, isRu ? 'ru' : 'uz');
  const currentRoleName = resolveRoleLabel(flow.currentRole, isRu ? 'ru' : 'uz');

  const handleSelectRole = (btCode, roleCode) => {
    if (btCode === selectedBT && roleCode === flow.currentRole) return;
    if (flow.isDirty) {
      const confirmLeave = window.confirm(
        isRu
          ? 'У вас есть несохранённые изменения. Отменить их и перейти к другой роли?'
          : 'Sizda saqlanmagan o‘zgarishlar bor. Bekor qilib boshqa rolga o‘tishni xohlaysizmi?'
      );
      if (!confirmLeave) return;
      flow.handleReset();
    }
    if (btCode !== selectedBT) onSelectBT(btCode);
    flow.setCurrentRole(roleCode);
    if (onSelectRole) onSelectRole(roleCode);
  };

  return (
    <div className="space-y-6">
      <AccessRightsTemplatesKPIs
        totalEmployees={totalEmployees}
        standardEmployees={standardEmployees}
        exceptionEmployees={exceptionEmployees}
        businessTypesCount={businessTypesCount}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <AccessRightsTemplatesSidebar
          groupedTemplates={groupedTemplates}
          selectedBT={selectedBT}
          selectedRole={flow.currentRole}
          onSelectRole={handleSelectRole}
        />

        <AccessRightsTemplateEditor
          businessTypeName={currentBTName}
          roleName={currentRoleName}
          roleCode={flow.currentRole}
          templateSource={flow.templateSource}
          employeesCount={currentRoleEmployees}
          exceptionsCount={currentRoleExceptions}
          moduleGroups={flow.moduleGroups}
          moduleToggles={flow.toggles}
          isDirty={flow.isDirty}
          dirtyCount={flow.dirtyCount}
          isSaving={flow.isSaving}
          onToggleModule={flow.handleToggleModule}
          onEnableGroup={flow.handleEnableGroup}
          onDisableGroup={flow.handleDisableGroup}
          onReset={flow.handleReset}
          onResetToDefault={flow.handleResetToDefault}
          onSave={flow.handleSave}
          onViewStaff={() => onSwitchToStaff && onSwitchToStaff(selectedBT, flow.currentRole)}
          onCopyFromOther={onOpenCopyTemplate}
        />
      </div>
    </div>
  );
}
