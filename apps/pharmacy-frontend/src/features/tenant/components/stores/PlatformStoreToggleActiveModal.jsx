import React from 'react';
import { AlertTriangle, CheckCircle2, Power } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../../components/ui';

export default function PlatformStoreToggleActiveModal({
  open = false,
  store = null,
  onClose,
  onConfirm,
  isToggling = false,
  t,
}) {
  if (!open || !store) return null;

  const isDeactivating = Boolean(store.active);

  return (
    <BaseModal
      open={open}
      title={
        isDeactivating
          ? t('platform.deactivateBranchTitle', { defaultValue: 'Filialni faolsizlantirish' })
          : t('platform.activateBranchTitle', { defaultValue: 'Filialni faollashtirish' })
      }
      onClose={onClose}
      size="md"
      closeLabel={t('common.close', { defaultValue: 'Yopish' })}
      footer={(
        <div className="flex items-center justify-end gap-2 w-full">
          <BaseButton variant="secondary" onClick={onClose} disabled={isToggling}>
            {t('common.cancel', { defaultValue: 'Bekor qilish' })}
          </BaseButton>
          <BaseButton
            variant={isDeactivating ? 'danger' : 'primary'}
            onClick={() => onConfirm?.(store)}
            loading={isToggling}
            className="cursor-pointer"
          >
            <Power size={15} />
            <span>
              {isDeactivating
                ? t('platform.confirmDeactivate', { defaultValue: 'Ha, faolsizlantirish' })
                : t('platform.confirmActivate', { defaultValue: 'Ha, faollashtirish' })}
            </span>
          </BaseButton>
        </div>
      )}
    >
      <div className="space-y-3">
        <div
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs leading-relaxed ${
            isDeactivating
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          {isDeactivating ? (
            <AlertTriangle size={20} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          ) : (
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">
              «{store.name}» (ID: #{store.id})
            </p>
            {store.companyName ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kompaniya: {store.companyName}
              </p>
            ) : null}
            {isDeactivating ? (
              <p className="mt-1 text-amber-800 dark:text-amber-300">
                Ushbu filialni faolsizlantirmoqchimisiz? Filial nofaol holatga o‘tkazilganda, <strong>barcha savdo kassalari va xodimlarning ushbu filialdagi amaliy faoliyati to‘xtatiladi</strong>.
              </p>
            ) : (
              <p className="mt-1 text-emerald-800 dark:text-emerald-300">
                Ushbu filialni qayta faollashtirmoqchimisiz? Filial faol holatga o‘tgach, kassalar va savdo jarayonlari qayta tiklanadi.
              </p>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
