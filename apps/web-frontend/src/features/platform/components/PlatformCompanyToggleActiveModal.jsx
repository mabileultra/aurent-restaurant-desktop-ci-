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
      className="companies-toggle-modal rounded-aa-lg border-aa-line bg-aa-surface shadow-aa-modal"
      closeLabel={t('common.close', { defaultValue: 'Yopish' })}
      footer={(
        <div className="flex items-center justify-end gap-2 w-full">
          <BaseButton variant="secondary" onClick={onClose} disabled={isToggling} className="aa-btn aa-btn--secondary aa-size-md">
            {t('common.cancel', { defaultValue: 'Bekor qilish' })}
          </BaseButton>
          <BaseButton
            variant={isDeactivating ? 'danger' : 'primary'}
            onClick={() => onConfirm?.(company)}
            loading={isToggling}
            className={`aa-size-md cursor-pointer ${isDeactivating ? 'aa-btn--danger' : 'aa-btn--primary'}`}
          >
            <Power size={16} />
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
          className={`flex items-start gap-3 p-3.5 rounded-aa-md border text-xs leading-relaxed ${
            isDeactivating
              ? 'bg-aa-warning-soft border-transparent text-aa-ink'
              : 'bg-aa-success-soft border-transparent text-aa-ink'
          }`}
        >
          {isDeactivating ? (
            <AlertTriangle size={20} className="shrink-0 text-aa-warning mt-0.5" />
          ) : (
            <CheckCircle2 size={20} className="shrink-0 text-aa-success mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm text-aa-ink">
              «{company.name}» (ID: #{company.id})
            </p>
            {isDeactivating ? (
              <p className="mt-1 text-aa-ink">
                Ushbu kompaniyani faolsizlantirmoqchimisiz? Kompaniya nofaol holatga o‘tkazilganda, <strong>barcha filiallar va savdo kassalari dasturiy faoliyati to‘xtatiladi</strong>.
              </p>
            ) : (
              <p className="mt-1 text-aa-ink">
                Ushbu kompaniyani qayta faollashtirmoqchimisiz? Kompaniya faol holatga o‘tgach, kassalar va filiallar tizimga qayta ulanadi.
              </p>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
