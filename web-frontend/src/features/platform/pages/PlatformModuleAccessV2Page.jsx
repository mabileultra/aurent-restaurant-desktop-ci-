import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Loader2, ArrowLeft } from 'lucide-react';
import BusinessTypePills from '../components/access-rights/cards/BusinessTypePills';
import RoleCard from '../components/access-rights/cards/RoleCard';
import RoleTemplateDrawer from '../components/access-rights/cards/RoleTemplateDrawer';
import RoleEmployeesDrawer from '../components/access-rights/cards/RoleEmployeesDrawer';
import RoleHistoryModal from '../components/access-rights/cards/RoleHistoryModal';
import { useAccessRightsV2Data } from '../components/access-rights/hooks/useAccessRightsV2Data';

export default function PlatformModuleAccessV2Page() {
  const {
    selectedBT,
    setSelectedBT,
    businessTypes,
    roles,
    rawUsers,
    moduleGroups,
    catalogMap,
    isLoading,
    handleResetUser,
    handleSaveRoleTemplate,
  } = useAccessRightsV2Data();

  const [configuringRole, setConfiguringRole] = useState(null);
  const [viewingRoleEmployees, setViewingRoleEmployees] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const currentBT = businessTypes.find((b) => b.code === selectedBT) || businessTypes[0] || {
    name: selectedBT,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Sarlavha va Klassik ko'rinishga qaytish */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/platform/access"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Klassik jadval</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="rounded-md bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 font-semibold dark:bg-emerald-950 dark:text-emerald-300">
              V2 Kartali ko'rinish
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kirish huquqlari
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Har bir rol — bitta karta. Kartada nimalar ochiqligi ko'rinadi, "Sozlash" bosilsa yon panelda o'zgartiriladi.
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin text-emerald-600" />
            <span>Ma'lumotlar yangilanmoqda...</span>
          </div>
        )}
      </div>

      {/* Faoliyat turlari gorizontal tanlovi (Haqiqiy 9 ta tur) */}
      <BusinessTypePills
        businessTypes={businessTypes}
        selectedCode={selectedBT}
        onSelect={setSelectedBT}
      />

      {/* Har bir rol uchun kartalar to'plami */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {roles.map((role) => (
          <RoleCard
            key={role.code}
            role={role}
            onConfigure={(r) => setConfiguringRole(r)}
            onViewEmployees={(r) => setViewingRoleEmployees(r)}
          />
        ))}
      </div>

      {/* O'zgarishlar tarixi havolasi */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-900 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>O'zgarishlar tarixi</span>
        </button>
      </div>

      {/* Yon panel: Shablonni sozlash */}
      <RoleTemplateDrawer
        isOpen={Boolean(configuringRole)}
        onClose={() => setConfiguringRole(null)}
        role={configuringRole}
        businessTypeName={currentBT.name}
        moduleGroups={moduleGroups}
        onSaveTemplate={handleSaveRoleTemplate}
      />

      {/* Yon panel: Haqiqiy xodimlarni ko'rish va boshqarish */}
      <RoleEmployeesDrawer
        isOpen={Boolean(viewingRoleEmployees)}
        onClose={() => setViewingRoleEmployees(null)}
        role={viewingRoleEmployees}
        businessTypeName={currentBT.name}
        users={rawUsers}
        catalogMap={catalogMap}
        onResetUserToTemplate={handleResetUser}
      />

      {/* Modal: O'zgarishlar tarixi */}
      <RoleHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
