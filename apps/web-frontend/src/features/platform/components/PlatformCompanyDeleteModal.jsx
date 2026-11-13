import React from 'react';
import { AlertTriangle, Power, Trash2 } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../components/ui';

export default function PlatformCompanyDeleteModal({
  open = false,
  company = null,
  onClose,
  onConfirmDelete,
  onToggleActive,
  isDeleting = false,
  t,
}) {
  if (!open || !company) return null;

  const storeCount = company.storeCount ?? 0;
  const hasStores = storeCount > 0;

  return (
    <BaseModal
      open={open}
      title={t('platform.deleteCompanyTitle', { defaultValue: 'Kompaniyani o‘chirish' })}
      onClose={onClose}
      size="md"
      className="companies-delete-modal rounded-aa-lg border-aa-line bg-aa-surface shadow-aa-modal"
      closeLabel={t('common.close', { defaultValue: 'Yopish' })}
      footer={(
        <div className="flex flex-wrap items-center justify-end gap-2 w-full">
          <BaseButton variant="secondary" onClick={onClose} disabled={isDeleting} className="aa-btn aa-btn--secondary aa-size-md">
            {t('common.cancel', { defaultValue: 'Bekor qilish' })}
          </BaseButton>

          {/* Safe action: Deactivate / Activate */}
          <BaseButton
            variant="outline"
            onClick={() => {
              onClose?.();
              onToggleActive?.(company);
            }}
            disabled={isDeleting}
            className="aa-btn aa-btn--secondary aa-size-md cursor-pointer"
          >
            <Power size={16} className={company.active ? 'text-aa-warning' : 'text-aa-success'} />
            <span>
              {company.active
                ? t('platform.deactivate', { defaultValue: 'Faolsizlantirish' })
                : t('platform.activate', { defaultValue: 'Faollashtirish' })}
            </span>
          </BaseButton>

          {/* Destructive action: Delete */}
          {!hasStores ? (
            <BaseButton
              variant="danger"
              onClick={() => onConfirmDelete?.(company)}
              loading={isDeleting}
              className="aa-btn aa-btn--danger aa-size-md cursor-pointer"
            >
              <Trash2 size={16} />
              <span>{t('common.delete', { defaultValue: 'O‘chirish' })}</span>
            </BaseButton>
          ) : null}
        </div>
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-aa-md bg-aa-warning-soft border border-transparent text-aa-ink">
          <AlertTriangle size={20} className="shrink-0 text-aa-warning mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-sm text-aa-ink">
              «{company.name}» (ID: #{company.id})
            </p>
            {!company.active ? (
              hasStores ? (
                <p className="mt-1 text-aa-ink">
                  Ushbu kompaniya <strong>allaqachon nofaol</strong> holatda. Kompaniyada <strong>{storeCount} ta savdo do‘koni (filial)</strong> biriktirilganligi sababli uni to‘g‘ridan-to‘g‘ri o‘chirish mumkin emas. Avval «Filiallar» bo‘limida filiallarni olib tashlang.
                </p>
              ) : (
                <p className="mt-1 text-aa-ink">
                  Ushbu kompaniya <strong>allaqachon nofaol</strong> holatda. Kompaniyani butunlay o‘chirib yuborishingiz yoki yana qayta faollashtirishingiz mumkin.
                </p>
              )
            ) : hasStores ? (
              <p className="mt-1 text-aa-ink">
                Ushbu kompaniyaga <strong>{storeCount} ta savdo do‘koni (filial)</strong> biriktirilgan. Do‘konlar mavjud bo‘lganda kompaniyani to‘g‘ridan-to‘g‘ri o‘chirish mumkin emas. Kompaniyani o‘chirish o‘rniga uni <strong>faolsizlantirish</strong> (nofaol holatga o‘tkazish) tavsiya etiladi.
              </p>
            ) : (
              <p className="mt-1 text-aa-ink">
                Kompaniyani o‘chirish qaytarib bo‘lmaydigan amaldir. Kompaniyani butunlay o‘chirish o‘rniga uni <strong>faolsizlantirishingiz</strong> mumkin.
              </p>
            )}
          </div>
        </div>

        {company.loginCode ? (
          <div className="text-xs text-aa-ink-muted">
            Kirish kodi: <span className="font-mono font-bold text-aa-ink">{company.loginCode}</span>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}
