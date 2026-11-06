import React from 'react';
import { UserPlus, ShieldCheck, ShieldAlert, Edit2 } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import { STAFF_ROLES_CONFIG } from '../../utils/securityConstants';
import PlatformSecurityStaffMatrixCard from './PlatformSecurityStaffMatrixCard';
import PlatformSecurityStaffDrawer from './PlatformSecurityStaffDrawer';

export default function PlatformSecurityStaffTab({ flow }) {
  const {
    staffList,
    permissionsMatrix,
    form,
    openCreate,
    openEdit,
    closeForm,
    updateField,
    handleSubmit,
    isSaving,
    currentTempPassword,
    cycleTempPassword,
  } = flow;

  return (
    <div className="space-y-6">
      {/* 1. Xodimlar jadvali bloki */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Super-admin va platforma xodimlari</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {staffList.length} ta
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Super-admin paneliga kirish huquqiga ega bo‘lgan xodimlar
            </p>
          </div>
          <BaseButton
            className="text-xs font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white self-start sm:self-center"
            onClick={openCreate}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Yangi xodim</span>
          </BaseButton>
        </div>

        {/* Jadval */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Xodim</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">2FA</th>
                <th className="py-2.5 px-3">Oxirgi kirish</th>
                <th className="py-2.5 px-3">Holat</th>
                <th className="py-2.5 px-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staffList.map((st) => {
                const roleConfig = STAFF_ROLES_CONFIG[st.role] || STAFF_ROLES_CONFIG.PLATFORM_ADMIN;
                const isLocked = st.status === 'locked';
                return (
                  <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ backgroundColor: roleConfig.bg, color: roleConfig.fg }}
                        >
                          {st.initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{st.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{st.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ backgroundColor: roleConfig.bg, color: roleConfig.fg }}
                      >
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          st.twoFactor
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {st.twoFactor ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {st.twoFactor ? 'Yoqilgan' : 'O‘chiq'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{st.lastSeen}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isLocked
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isLocked ? 'Bloklangan' : 'Faol'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(st)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 p-1"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Rollar va imkoniyatlar matritsasi */}
      <PlatformSecurityStaffMatrixCard permissionsMatrix={permissionsMatrix} />

      {/* Drawer */}
      <PlatformSecurityStaffDrawer
        form={form}
        onClose={closeForm}
        onUpdateField={updateField}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        tempPassword={currentTempPassword}
        onCycleTempPassword={cycleTempPassword}
      />
    </div>
  );
}
