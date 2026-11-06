import React from 'react';
import AccessRightsTemplatesKPIs from './AccessRightsTemplatesKPIs';
import AccessRightsTemplatesSidebar from './AccessRightsTemplatesSidebar';
import AccessRightsTemplateEditor from './AccessRightsTemplateEditor';
import { useAccessRightsTemplatesFlow } from '../hooks/useAccessRightsTemplatesFlow';
import { resolveRoleLabel, resolveBusinessTypeName } from '../utils/accessRightsCatalogUtils';

export default function AccessRightsTemplatesTab({
  businessTypes = [],
  roles = [],
  rawCatalog = [],
  totalEmployees = 0,
  standardEmployees = 0,
  exceptionEmployees = 0,
  selectedBT = 'RESTAURANT',
  onSelectBT,
  onSwitchToStaff,
  onOpenCopyTemplate,
}) {
  const flow = useAccessRightsTemplatesFlow({
    businessTypes,
    rawCatalog,
    roles,
    selectedBT,
    onSelectBT,
    onSwitchToStaff,
  });

  // Build groupedTemplates for sidebar
  const groupedTemplates = businessTypes.map((bt) => {
    const total = Number(bt.totalEmployees || 0);
    const adminCount = total > 0 ? Math.max(1, Math.round(total * 0.15)) : 0;
    const mgrCount = total > 0 ? Math.max(1, Math.round(total * 0.25)) : 0;
    const cashierCount = total > 0 ? Math.max(0, total - adminCount - mgrCount) : 0;

    return {
      code: bt.code,
      name: bt.name,
      totalEmployees: bt.totalEmployees,
      roles: (roles.length > 0 && bt.code === selectedBT ? roles : [
        { code: 'ADMIN', name: resolveRoleLabel('ADMIN'), totalEmployees: adminCount, exceptionCount: 0, enabledModulesCount: 42, totalModulesCount: 50 },
        { code: 'MANAGER', name: resolveRoleLabel('MANAGER'), totalEmployees: mgrCount, exceptionCount: 0, enabledModulesCount: 30, totalModulesCount: 50 },
        { code: 'CASHIER', name: resolveRoleLabel('CASHIER'), totalEmployees: cashierCount, exceptionCount: 0, enabledModulesCount: 12, totalModulesCount: 20 },
      ]),
    };
  });

  const currentRoleObj = roles.find((r) => r.code === flow.currentRole) || {
    name: resolveRoleLabel(flow.currentRole),
    totalEmployees: 0,
    exceptionCount: 0,
  };

  const currentBTObj = businessTypes.find((b) => b.code === selectedBT) || {
    name: resolveBusinessTypeName(selectedBT),
  };

  const handleSelectRole = (btCode, roleCode) => {
    if (btCode === selectedBT && roleCode === flow.currentRole) return;
    if (flow.isDirty) {
      const confirmLeave = window.confirm(
        'Sizda saqlanmagan o‘zgarishlar bor. Bekor qilib boshqa rolga o‘tishni xohlaysizmi?'
      );
      if (!confirmLeave) return;
      flow.handleReset();
    }
    if (btCode !== selectedBT) onSelectBT(btCode);
    flow.setCurrentRole(roleCode);
  };

  return (
    <div className="space-y-6">
      {/* 4 KPIs per Page 1 */}
      <AccessRightsTemplatesKPIs
        totalEmployees={totalEmployees}
        standardEmployees={standardEmployees}
        exceptionEmployees={exceptionEmployees}
        businessTypesCount={businessTypes.length}
      />

      {/* 2-Column Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        <AccessRightsTemplatesSidebar
          groupedTemplates={groupedTemplates}
          selectedBT={selectedBT}
          selectedRole={flow.currentRole}
          onSelectRole={handleSelectRole}
        />

        <AccessRightsTemplateEditor
          businessTypeName={currentBTObj.name}
          roleName={currentRoleObj.name || resolveRoleLabel(flow.currentRole)}
          roleCode={flow.currentRole}
          employeesCount={currentRoleObj.totalEmployees || 0}
          exceptionsCount={currentRoleObj.exceptionCount || 0}
          moduleGroups={flow.moduleGroups}
          moduleToggles={flow.toggles}
          isDirty={flow.isDirty}
          dirtyCount={flow.dirtyCount}
          isSaving={flow.isSaving}
          onToggleModule={flow.handleToggleModule}
          onEnableGroup={flow.handleEnableGroup}
          onDisableGroup={flow.handleDisableGroup}
          onReset={flow.handleReset}
          onSave={flow.handleSave}
          onViewStaff={() => onSwitchToStaff && onSwitchToStaff(selectedBT, flow.currentRole)}
          onCopyFromOther={onOpenCopyTemplate}
        />
      </div>
    </div>
  );
}
