import React, { useState } from 'react';
import { Copy, RotateCcw, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import UserExceptionTagsBlock from './UserExceptionTagsBlock';

export default function UserExceptionsDetail({
  user,
  onResetToTemplate,
  onOpenCopyModal,
  onSaveOverrides,
}) {
  const [grantedModules, setGrantedModules] = useState(() => user?.grantedModules || []);
  const [deniedModules, setDeniedModules] = useState(() => user?.deniedModules || []);
  const [isDirty, setIsDirty] = useState(false);

  const availableToGrant = [
    { id: 'cr_z_reports', name: 'Z-hisobotlar' },
    { id: 'cr_cashier_task', name: 'Kassa topshirig‘i' },
    { id: 'returns', name: 'Qaytarishlar' },
    { id: 'daily_summary', name: 'Kunlik xulosa' },
  ].filter((m) => !grantedModules.includes(m.id));

  const availableToDeny = [
    { id: 'pos_my_receipts', name: 'Mening cheklarim' },
    { id: 'pos_sales', name: 'Sotuv' },
    { id: 'pos_offline', name: 'Oflayn rejim' },
  ].filter((m) => !deniedModules.includes(m.id));

  const handleAddGrant = (name) => {
    setGrantedModules((prev) => [...prev, name]);
    setIsDirty(true);
  };

  const handleRemoveGrant = (name) => {
    setGrantedModules((prev) => prev.filter((item) => item !== name));
    setIsDirty(true);
  };

  const handleAddDeny = (name) => {
    setDeniedModules((prev) => [...prev, name]);
    setIsDirty(true);
  };

  const handleRemoveDeny = (name) => {
    setDeniedModules((prev) => prev.filter((item) => item !== name));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSaveOverrides?.(user.id, { grantedModules, deniedModules });
    setIsDirty(false);
    toast.success(`${user.fullName} uchun istisnolar saqlandi`);
  };

  const handleCancel = () => {
    setGrantedModules(user?.grantedModules || []);
    setDeniedModules(user?.deniedModules || []);
    setIsDirty(false);
    toast('O‘zgarishlar bekor qilindi', { icon: '↩️' });
  };

  const templateCount = user?.templateModulesCount ?? 3;
  const effectiveCount = Math.max(0, templateCount + grantedModules.length - deniedModules.length);

  return (
    <div className="flex flex-col space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
            {user?.initials || 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {user?.fullName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.username} · {user?.role} · {user?.companyName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCopyModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 cursor-pointer"
          >
            <Copy size={13} />
            <span>Huquqdan nusxa olish</span>
          </button>
          <button
            type="button"
            onClick={onResetToTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Shablonga qaytarish</span>
          </button>
        </div>
      </div>

      {/* Shablon notice */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-850 dark:text-slate-300">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
        <span>
          Asosiy huquqlar shablondan: <strong className="font-semibold text-slate-900 dark:text-white">{user?.businessType} · {user?.role} ({templateCount} modul)</strong>
        </span>
      </div>

      {/* 4 Metrics boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-850">
          <span className="text-[11px] font-medium text-slate-400">Shablondan</span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{templateCount} modul</p>
        </div>
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Qo‘shimcha ruxsat</span>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">+{grantedModules.length}</p>
        </div>
        <div className="rounded-xl border border-rose-200/70 bg-rose-50/30 p-2.5 dark:border-rose-900/40 dark:bg-rose-950/20">
          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Taqiqlangan</span>
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">-{deniedModules.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-850">
          <span className="text-[11px] font-medium text-slate-400">Yakuniy kirish</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{effectiveCount} modul</p>
        </div>
      </div>

      {/* Block 1: Qo'shimcha ruxsatlar */}
      <UserExceptionTagsBlock
        type="GRANT"
        title="Qo‘shimcha ruxsatlar"
        subtitle="shablonda yo‘q, lekin bu xodimga kerak"
        items={grantedModules}
        availableSuggestions={availableToGrant}
        onAdd={handleAddGrant}
        onRemove={handleRemoveGrant}
      />

      {/* Block 2: Taqiqlar */}
      <UserExceptionTagsBlock
        type="DENY"
        title="Taqiqlar"
        subtitle="shablonda bor, lekin bu xodimga yopiq"
        items={deniedModules}
        availableSuggestions={availableToDeny}
        onAdd={handleAddDeny}
        onRemove={handleRemoveDeny}
      />

      {/* Formula Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Natija: <strong className="font-bold text-slate-900 dark:text-white">{effectiveCount} modulga</strong> kirish bor (shablondan {templateCount}, +{grantedModules.length} ruxsat, -{deniedModules.length} taqiq)
        </span>

        {isDirty && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer dark:bg-emerald-500"
            >
              <Check size={13} />
              <span>Saqlash</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
