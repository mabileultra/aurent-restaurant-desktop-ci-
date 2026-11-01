import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft, AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import BusinessTypePills from '../components/access-rights/cards/BusinessTypePills';
import RoleCard from '../components/access-rights/cards/RoleCard';
import RoleTemplateDrawer from '../components/access-rights/cards/RoleTemplateDrawer';
import RoleEmployeesDrawer from '../components/access-rights/cards/RoleEmployeesDrawer';
import { useAccessRightsV2Data } from '../components/access-rights/hooks/useAccessRightsV2Data';

export default function PlatformModuleAccessV2Page() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'ru' ? 'ru' : 'uz';

  const {
    selectedBT,
    setSelectedBT,
    businessTypes,
    roles,
    rawUsers,
    moduleGroups,
    catalogMap,
    isLoading,
    isError,
    error,
    refetchAll,
    handleResetUser,
  } = useAccessRightsV2Data();

  const [configuringRole, setConfiguringRole] = useState(null);
  const [viewingRoleEmployees, setViewingRoleEmployees] = useState(null);

  const currentBT = businessTypes.find((b) => b.code === selectedBT) || businessTypes[0] || {
    name: selectedBT,
  };

  // C.16 Xodimi yo'q rollarni ixcham bo'limga ajratish
  const hasActiveEmployees = roles.some((r) => r.totalEmployees > 0);
  const activeRoles = hasActiveEmployees ? roles.filter((r) => r.totalEmployees > 0) : roles;
  const emptyRoles = hasActiveEmployees ? roles.filter((r) => r.totalEmployees === 0) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Sarlavha va Klassik ko'rinishga qaytish */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/platform/access"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>{currentLang === 'ru' ? 'Классическая таблица' : 'Klassik jadval'}</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="rounded-md bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 font-semibold dark:bg-emerald-950 dark:text-emerald-300">
              {currentLang === 'ru' ? 'V2 Карточный вид' : 'V2 Kartali ko‘rinish'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {currentLang === 'ru' ? 'Права доступа' : 'Kirish huquqlari'}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {currentLang === 'ru'
              ? 'Просмотр прав доступа к модулям по видам деятельности и ролям сотрудников, управление индивидуальными исключениями.'
              : 'Faoliyat turlari va xodimlar rollari bo‘yicha tizim modullariga kirish huquqlarini ko‘rish va individual istisnolarni boshqarish.'}
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <Loader2 size={14} className="animate-spin text-emerald-600" />
            <span>{currentLang === 'ru' ? 'Данные обновляются...' : 'Ma‘lumotlar yangilanmoqda...'}</span>
          </div>
        )}
      </div>

      {/* B.7 Xatolik holati (Error State) */}
      {isError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>
              {currentLang === 'ru'
                ? 'Произошла ошибка при загрузке данных: '
                : 'Ma‘lumotlarni yuklashda xatolik yuz berdi: '}
              <strong>{error?.message || (currentLang === 'ru' ? 'Сервер недоступен' : 'Server javob bermadi')}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={refetchAll}
            className="inline-flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-1.5 font-bold text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>{currentLang === 'ru' ? 'Повторить' : 'Qayta urinish'}</span>
          </button>
        </div>
      )}

      {/* Faoliyat turlari tanlovi */}
      <BusinessTypePills
        businessTypes={businessTypes}
        selectedCode={selectedBT}
        onSelect={setSelectedBT}
      />

      {/* Faol xodimga ega rollar kartalari to'plami */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {activeRoles.map((role) => (
          <RoleCard
            key={role.code}
            role={role}
            onConfigure={(r) => setConfiguringRole(r)}
            onViewEmployees={(r) => setViewingRoleEmployees(r)}
          />
        ))}
      </div>

      {/* C.16 Xodimi bo'lmagan rollar (Ixcham ko'rinish) */}
      {emptyRoles.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {currentLang === 'ru' ? 'Роли без сотрудников' : 'Xodimi bo‘lmagan rollar'} ({emptyRoles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {emptyRoles.map((role) => (
              <RoleCard
                key={role.code}
                role={role}
                isCompact={true}
                onConfigure={(r) => setConfiguringRole(r)}
                onViewEmployees={(r) => setViewingRoleEmployees(r)}
              />
            ))}
          </div>
        </div>
      )}

      {/* O'zgarishlar tarixi va audit (Backend kutilmoqda - Tez kunda) */}
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

      {/* Yon panel: Shablon huquqlarini ko'rish */}
      <RoleTemplateDrawer
        isOpen={Boolean(configuringRole)}
        onClose={() => setConfiguringRole(null)}
        role={configuringRole}
        businessTypeName={currentBT.name}
        moduleGroups={moduleGroups}
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
    </div>
  );
}
