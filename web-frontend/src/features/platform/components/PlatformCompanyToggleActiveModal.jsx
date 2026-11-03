import React from 'react';
import { AlertTriangle, CheckCircle2, Power } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../components/ui';

export default function PlatformCompanyToggleActiveModal({
  open = false,
  company = null,
  onClose,
  onConfirm,
  isToggling = false,
  t,
}) {
  if (!open || !company) return null;

  const isDeactivating = Boolean(company.active);

  return (
    <BaseModal
      open={open}
      title={
        isDeactivating
          ? t('platform.deactivateCompanyTitle', { defaultValue: 'Kompaniyani faolsizlantirish' })
          : t('platform.activateCompanyTitle', { defaultValue: 'Kompaniyani faollashtirish' })
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
            onClick={() => onConfirm?.(company)}
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
              «{company.name}» (ID: #{company.id})
            </p>
            {isDeactivating ? (
              <p className="mt-1 text-amber-800 dark:text-amber-300">
                Ushbu kompaniyani faolsizlantirmoqchimisiz? Kompaniya nofaol holatga o‘tkazilganda, <strong>barcha filiallar va savdo kassalari dasturiy faoliyati to‘xtatiladi</strong>.
              </p>
            ) : (
              <p className="mt-1 text-emerald-800 dark:text-emerald-300">
                Ushbu kompaniyani qayta faollashtirmoqchimisiz? Kompaniya faol holatga o‘tgach, kassalar va filiallar tizimga qayta ulanadi.
              </p>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
