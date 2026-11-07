import React from 'react';
import { UserPlus, Edit2, Users } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import { STAFF_ROLES_CONFIG } from '../../utils/securityConstants';
import PlatformSecurityStaffMatrixCard from './PlatformSecurityStaffMatrixCard';
import PlatformSecurityStaffDrawer from './PlatformSecurityStaffDrawer';

export default function PlatformSecurityStaffTab({ flow }) {
  const {
    staffList,
    isLoading,
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
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Super-admin va platforma xodimlari</span>
              {!isLoading && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {staffList.length} ta
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Super-admin paneliga kirish huquqiga ega bo‘lgan xodimlar
            </p>
          </div>
          <BaseButton
            className="text-xs font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white self-start sm:self-center min-h-[38px]"
            onClick={openCreate}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Yangi xodim</span>
          </BaseButton>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Xodim</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">Holat</th>
                <th className="py-2.5 px-3 text-right w-20">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                [1, 2, 3].map((idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div className="space-y-1">
                          <div className="w-28 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="w-20 h-2.5 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <span>Platforma administratorlari topilmadi</span>
                  </td>
                </tr>
              ) : (
                staffList.map((st) => {
                  const roleConfig = STAFF_ROLES_CONFIG[st.role] || STAFF_ROLES_CONFIG.PLATFORM_ADMIN;
                  const isActive = st.active !== false;

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
                            <div className="text-[11px] text-slate-400 font-mono">
                              {st.email ? st.email : `@${st.username}`}
                            </div>
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
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(st)}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 min-w-[36px] min-h-[36px]"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PlatformSecurityStaffMatrixCard permissionsMatrix={permissionsMatrix} />

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
