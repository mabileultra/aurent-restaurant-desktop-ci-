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
          className={`flex items-start gap-3 text-xs leading-relaxed ${
            isDeactivating ? 'ui-alert-warning' : 'ui-alert-success'
          }`}
        >
          {isDeactivating ? (
            <AlertTriangle size={20} className="shrink-0 text-warning mt-0.5" />
          ) : (
            <CheckCircle2 size={20} className="shrink-0 text-success mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm text-ink">
              «{store.name}» (ID: #{store.id})
            </p>
            {store.companyName ? (
              <p className="text-xs text-ink-muted mt-0.5">
                Kompaniya: {store.companyName}
              </p>
            ) : null}
            {isDeactivating ? (
              <p className="mt-1 text-warning-text">
                Ushbu filialni faolsizlantirmoqchimisiz? Filial nofaol holatga o‘tkazilganda, <strong>barcha savdo kassalari va xodimlarning ushbu filialdagi amaliy faoliyati to‘xtatiladi</strong>.
              </p>
            ) : (
              <p className="mt-1 text-success-text">
                Ushbu filialni qayta faollashtirmoqchimisiz? Filial faol holatga o‘tgach, kassalar va savdo jarayonlari qayta tiklanadi.
              </p>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
