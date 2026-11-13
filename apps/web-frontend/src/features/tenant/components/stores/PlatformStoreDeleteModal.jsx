import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Power, Trash2, Users } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../../components/ui';
import { userApi } from '../../../../api';

export default function PlatformStoreDeleteModal({
  open = false,
  store = null,
  onClose,
  onConfirmDelete,
  onToggleActive,
  isDeleting = false,
  t,
}) {
  const { data: usersData, isPending: usersLoading } = useQuery({
    queryKey: ['store-users-check', store?.companyId, store?.id],
    queryFn: () =>
      store?.companyId
        ? userApi.listManaged({ companyId: store.companyId, page: 0, size: 200 }).then((r) => r.data)
        : Promise.resolve({ content: [] }),
    enabled: Boolean(open && store?.id),
    staleTime: 30_000,
  });

  if (!open || !store) return null;

  const usersList = usersData?.content || [];
  const assignedUsers = usersList.filter(
    (u) =>
      Number(u.storeId) === Number(store.id) ||
      (Array.isArray(u.storeIds) && u.storeIds.some((sId) => Number(sId) === Number(store.id)))
  );
  const userCount = assignedUsers.length;
  const hasUsers = userCount > 0;

  return (
    <BaseModal
      open={open}
      title={t('platform.deleteBranchTitle', { defaultValue: 'Filialni o‘chirish' })}
      onClose={onClose}
      size="md"
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
              onToggleActive?.(store);
            }}
            disabled={isDeleting}
            className="aa-btn aa-btn--secondary aa-size-md cursor-pointer"
          >
            <Power size={16} className={store.active ? 'text-aa-warning' : 'text-aa-success'} />
            <span>
              {store.active
                ? t('platform.deactivate', { defaultValue: 'Faolsizlantirish' })
                : t('platform.activate', { defaultValue: 'Faollashtirish' })}
            </span>
          </BaseButton>

          {/* Destructive action: Delete */}
          {!hasUsers ? (
            <BaseButton
              variant="danger"
              onClick={() => onConfirmDelete?.(store)}
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
              «{store.name}» (ID: #{store.id})
            </p>
            {store.companyName ? (
              <p className="text-xs text-aa-ink-muted mt-0.5">
                Kompaniya: {store.companyName}
              </p>
            ) : null}

            {hasUsers ? (
              <p className="mt-2 text-aa-danger font-medium">
                Ushbu filialga <strong>{userCount} nafar xodim</strong> biriktirilgan. Xodimlar biriktirilgan filial o‘chirilsa, xodimlarning akkauntida uzilishlar yuzaga keladi. Avval «Xodimlar» bo‘limida xodimlarni boshqa filialga o‘tkazing yoki filialni <strong>faolsizlantiring</strong>.
              </p>
            ) : !store.active ? (
              <p className="mt-2 text-aa-ink">
                Ushbu filial <strong>allaqachon nofaol</strong> holatda. Filialni butunlay o‘chirib yuborishingiz yoki qayta faollashtirishingiz mumkin.
              </p>
            ) : (
              <p className="mt-2 text-aa-ink">
                Filialni o‘chirish qaytarib bo‘lmaydigan amaldir. Kassalar va do‘kon tarixini saqlab qolish uchun filialni butunlay o‘chirish o‘rniga uni <strong>faolsizlantirishingiz</strong> mumkin.
              </p>
            )}
          </div>
        </div>

        {hasUsers && !usersLoading ? (
          <div className="p-3 rounded-aa-md border border-transparent bg-aa-danger-soft text-xs text-aa-danger space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Users size={14} />
              <span>Biriktirilgan xodimlar ({userCount}):</span>
            </div>
            <p className="truncate text-xs text-aa-danger">
              {assignedUsers.slice(0, 3).map((u) => u.fullName || u.username).join(', ')}
              {userCount > 3 ? ` va yana ${userCount - 3} kishi` : ''}
            </p>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}
