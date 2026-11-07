import React from 'react';
import { X, RefreshCw, Copy, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BaseButton, BaseInput } from '../../../../components/ui';
import { STAFF_ROLES_CONFIG } from '../../utils/securityConstants';

export default function PlatformSecurityStaffDrawer({
  form,
  onClose,
  onUpdateField,
  onSubmit,
  isSaving,
  tempPassword,
  onCycleTempPassword,
}) {
  if (!form) return null;

  const isCreate = form.mode === 'create';
  const rolesList = Object.values(STAFF_ROLES_CONFIG);
  const emailWarn = /@platform\.local$/i.test(form.email || '');

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    toast.success('Parol nusxalandi');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isCreate ? 'Yangi xodim' : 'Xodimni tahrirlash'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCreate ? 'Super-admin paneliga kirish beriladi' : `${form.firstName} ${form.lastName} · ${form.username}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="staff-form" onSubmit={onSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <BaseInput label="Ism" value={form.firstName} onChange={(e) => onUpdateField('firstName', e.target.value)} placeholder="Dilnoza" required />
            <BaseInput label="Familiya" value={form.lastName} onChange={(e) => onUpdateField('lastName', e.target.value)} placeholder="Karimova" required />
          </div>

          {isCreate ? (
            <>
              <BaseInput label="Login" value={form.username} onChange={(e) => onUpdateField('username', e.target.value)} placeholder="Kirish nomi" required />
              <div>
                <BaseInput label="Email" type="email" value={form.email} onChange={(e) => onUpdateField('email', e.target.value)} placeholder="ism@kompaniya.uz" required />
                {emailWarn && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>@platform.local manziliga email xabarlari yetib bormaydi</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Login</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">{form.username}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">{form.email || 'Email yo‘q'}</span>
              </div>
            </div>
          )}

          {isCreate ? (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rol</label>
              <div className="space-y-2">
                {rolesList.map((role) => (
                  <label
                    key={role.id}
                    onClick={() => onUpdateField('role', role.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.role === role.id
                        ? 'border-emerald-700 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <input type="radio" name="role" value={role.id} checked={form.role === role.id} onChange={() => onUpdateField('role', role.id)} className="mt-1 text-emerald-700" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{role.label}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{role.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px]">Biriktirilgan rol:</span>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{STAFF_ROLES_CONFIG[form.role]?.label || form.role}</div>
            </div>
          )}

          {!isCreate && (
            <div className="pt-1">
              <BaseInput label="Yangi parol (ixtiyoriy)" type="password" value={form.password || ''} onChange={(e) => onUpdateField('password', e.target.value)} placeholder="O‘zgarishsiz qoldirish uchun bo‘sh qoldiring" />
            </div>
          )}

          {isCreate && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
                <span>Vaqtinchalik xavfsiz parol</span>
                <button type="button" onClick={onCycleTempPassword} className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>Yangi parol</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wider">{tempPassword}</span>
                <button type="button" onClick={handleCopyPassword} className="p-1 rounded text-slate-500" title="Nusxa olish">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-2">
          <BaseButton type="button" variant="secondary" className="flex-1" onClick={onClose}>Bekor qilish</BaseButton>
          <BaseButton type="submit" form="staff-form" className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white" disabled={isSaving}>
            {isCreate ? 'Xodimni yaratish' : 'Saqlash'}
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
