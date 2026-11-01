import React, { useState } from 'react';
import toast from 'react-hot-toast';
import AccessRightsKpiCards from './AccessRightsKpiCards';
import RoleTemplatesSidebar from './RoleTemplatesSidebar';
import RoleTemplateEditor from './RoleTemplateEditor';
import RoleTemplateBlastRadiusFooter from './RoleTemplateBlastRadiusFooter';
import RoleTemplatesMatrixModal from './RoleTemplatesMatrixModal';
import {
  BUSINESS_TYPES_CATALOG,
  DEFAULT_KPI_STATS,
  MODULE_GROUPS_CATALOG,
} from '../mock/accessRightsDefaultData';

export default function RoleTemplatesTab({ onSwitchToUserExceptions }) {
  const [selectedBT, setSelectedBT] = useState('RESTAURANT');
  const [selectedRole, setSelectedRole] = useState('MANAGER');
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Active module IDs in currently selected template
  const [activeModules, setActiveModules] = useState(() => {
    const set = new Set();
    MODULE_GROUPS_CATALOG.forEach((g) => {
      g.modules.forEach((m) => {
        if (m.id !== 'fin_journal' && m.id !== 'fin_reports') set.add(m.id);
      });
    });
    return set;
  });

  const [dirtyModules, setDirtyModules] = useState(() => new Map());

  const currentBT = BUSINESS_TYPES_CATALOG.find((b) => b.code === selectedBT) || BUSINESS_TYPES_CATALOG[0];
  const currentRole = currentBT.roles.find((r) => r.code === selectedRole) || currentBT.roles[0];

  const handleToggleModule = (modId) => {
    setDirtyModules((prev) => {
      const next = new Map(prev);
      const isCurrentlyActive = next.has(modId) ? next.get(modId) : activeModules.has(modId);
      const newState = !isCurrentlyActive;
      if (newState === activeModules.has(modId)) {
        next.delete(modId);
      } else {
        next.set(modId, newState);
      }
      return next;
    });
  };

  const handleEnableAllInGroup = (modules) => {
    setDirtyModules((prev) => {
      const next = new Map(prev);
      modules.forEach((m) => {
        if (!activeModules.has(m.id)) next.set(m.id, true);
        else next.delete(m.id);
      });
      return next;
    });
  };

  const handleDisableAllInGroup = (modules) => {
    setDirtyModules((prev) => {
      const next = new Map(prev);
      modules.forEach((m) => {
        if (activeModules.has(m.id)) next.set(m.id, false);
        else next.delete(m.id);
      });
      return next;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setActiveModules((prev) => {
        const next = new Set(prev);
        dirtyModules.forEach((val, id) => {
          if (val) next.add(id);
          else next.delete(id);
        });
        return next;
      });
      setDirtyModules(new Map());
      setIsSaving(false);
      toast.success(`${currentRole.name} shabloni saqlandi va barcha xodimlarga qo'llandi`);
    }, 400);
  };

  const handleReset = () => {
    setDirtyModules(new Map());
    toast('O‘zgarishlar bekor qilindi', { icon: '↩️' });
  };

  const totalModulesCount = MODULE_GROUPS_CATALOG.reduce((acc, g) => acc + g.modules.length, 0);
  const effectiveActiveCount = MODULE_GROUPS_CATALOG.reduce((acc, g) => {
    return (
      acc +
      g.modules.filter((m) => (dirtyModules.has(m.id) ? dirtyModules.get(m.id) : activeModules.has(m.id))).length
    );
  }, 0);

  return (
    <div className="space-y-4">
      <AccessRightsKpiCards stats={DEFAULT_KPI_STATS} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 items-start">
        <RoleTemplatesSidebar
          businessTypes={BUSINESS_TYPES_CATALOG}
          selectedBusinessType={selectedBT}
          selectedRole={selectedRole}
          onSelectRole={(bt, r) => {
            setSelectedBT(bt);
            setSelectedRole(r);
            setDirtyModules(new Map());
          }}
        />

        <RoleTemplateEditor
          businessTypeName={currentBT.name}
          roleName={currentRole.name}
          enabledCount={effectiveActiveCount}
          totalCount={totalModulesCount}
          employeeCount={currentRole.totalEmployees}
          exceptionCount={currentRole.exceptionCount}
          moduleGroups={MODULE_GROUPS_CATALOG}
          activeModules={activeModules}
          dirtyModules={dirtyModules}
          onToggleModule={handleToggleModule}
          onEnableAllInGroup={handleEnableAllInGroup}
          onDisableAllInGroup={handleDisableAllInGroup}
          onOpenMatrix={() => setIsMatrixOpen(true)}
          onCopyFromOther={() => toast('Boshqa shablondan nusxa olish modali ochildi')}
          onViewEmployees={onSwitchToUserExceptions}
        />
      </div>

      <RoleTemplateBlastRadiusFooter
        unsavedCount={dirtyModules.size}
        affectedCount={currentRole.totalEmployees}
        onReset={handleReset}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <RoleTemplatesMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        businessTypeName={currentBT.name}
        roles={currentBT.roles}
        moduleGroups={MODULE_GROUPS_CATALOG}
        matrixState={{}}
        onToggleCell={() => {}}
      />
    </div>
  );
}
