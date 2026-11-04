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
      closeLabel={t('common.close', { defaultValue: 'Yopish' })}
      footer={(
        <div className="flex flex-wrap items-center justify-end gap-2 w-full">
          <BaseButton variant="secondary" onClick={onClose} disabled={isDeleting}>
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
            className={company.active ? 'text-amber-700 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300' : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300'}
          >
            <Power size={15} />
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
            >
              <Trash2 size={15} />
              <span>{t('common.delete', { defaultValue: 'O‘chirish' })}</span>
            </BaseButton>
          ) : null}
        </div>
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
          <AlertTriangle size={20} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-sm text-slate-900 dark:text-white">
              «{company.name}» (ID: #{company.id})
            </p>
            {!company.active ? (
              hasStores ? (
                <p className="mt-1 text-amber-800 dark:text-amber-300">
                  Ushbu kompaniya <strong>allaqachon nofaol</strong> holatda. Kompaniyada <strong>{storeCount} ta savdo do‘koni (filial)</strong> biriktirilganligi sababli uni to‘g‘ridan-to‘g‘ri o‘chirish mumkin emas. Avval «Filiallar» bo‘limida filiallarni olib tashlang.
                </p>
              ) : (
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Ushbu kompaniya <strong>allaqachon nofaol</strong> holatda. Kompaniyani butunlay o‘chirib yuborishingiz yoki yana qayta faollashtirishingiz mumkin.
                </p>
              )
            ) : hasStores ? (
              <p className="mt-1 text-amber-800 dark:text-amber-300">
                Ushbu kompaniyaga <strong>{storeCount} ta savdo do‘koni (filial)</strong> biriktirilgan. Do‘konlar mavjud bo‘lganda kompaniyani to‘g‘ridan-to‘g‘ri o‘chirish mumkin emas. Kompaniyani o‘chirish o‘rniga uni <strong>faolsizlantirish</strong> (nofaol holatga o‘tkazish) tavsiya etiladi.
              </p>
            ) : (
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Kompaniyani o‘chirish qaytarib bo‘lmaydigan amaldir. Kompaniyani butunlay o‘chirish o‘rniga uni <strong>faolsizlantirishingiz</strong> mumkin.
              </p>
            )}
          </div>
        </div>

        {company.loginCode ? (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Kirish kodi: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{company.loginCode}</span>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}
