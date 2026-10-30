import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { platformDesktopNotificationsApi } from '../../../api';

/**
 * Encapsulates drawer selection, revoke, extend, and duplicate actions
 * for platform desktop notifications, maintaining SRP.
 */
export function useDesktopNotificationActions({
  queryClient,
  t,
  setTitle,
  setBody,
  setKind,
  draft,
}) {
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState(null);
  const [revokeConfirmItem, setRevokeConfirmItem] = useState(null);

  const handleDuplicate = useCallback(
    (item) => {
      if (!item) return;
      setTitle(item.title || '');
      setBody(item.body || '');
      if (item.kind) setKind(item.kind);
      setSelectedItemForDrawer(null);
      draft?.setIsDraftRestored(false);
      toast.success(t('platform.desktopNotifications.actionDuplicate', { defaultValue: 'Nusxa olindi' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => document.getElementById('broadcast-title-input')?.focus(), 150);
    },
    [t, draft, setTitle, setBody, setKind]
  );

  const handleRevoke = useCallback(
    async (targetItem) => {
      const item = targetItem ?? selectedItemForDrawer;
      if (!item?.id) return;
      const isExpired =
        item.status === 'EXPIRED' ||
        (item.expiresAt && new Date(item.expiresAt).getTime() <= Date.now());
      if (isExpired) {
        toast.error(
          t('platform.desktopNotifications.cannotRevokeExpired', {
            defaultValue: 'Muddati tugagan xabarni olib tashlab bo‘lmaydi',
          })
        );
        return;
      }
      try {
        await platformDesktopNotificationsApi.revoke(item.id);
        toast.success(
          t('platform.desktopNotifications.revoked', {
            defaultValue: 'Xabar kassalardan olib tashlandi',
          })
        );
        queryClient.invalidateQueries({ queryKey: ['platform-desktop-notifications'] });
        if (selectedItemForDrawer?.id === item.id) {
          setSelectedItemForDrawer(null);
        }
      } catch (e) {
        toast.error(
          e.response?.data?.message ??
            t('platform.desktopNotifications.revokeFailed', {
              defaultValue: 'Xabarni olib tashlab bo‘lmadi',
            })
        );
      }
    },
    [selectedItemForDrawer, t, queryClient]
  );

  const handleRevokePrompt = useCallback(
    (item) => {
      const target = item ?? selectedItemForDrawer;
      const isExpired =
        target?.status === 'EXPIRED' ||
        (target?.expiresAt && new Date(target.expiresAt).getTime() <= Date.now());
      if (isExpired) {
        toast.error(
          t('platform.desktopNotifications.cannotRevokeExpired', {
            defaultValue: 'Muddati tugagan xabarni olib tashlab bo‘lmaydi',
          })
        );
        return;
      }
      setRevokeConfirmItem(target);
    },
    [selectedItemForDrawer, t]
  );

  const handleConfirmRevoke = useCallback(async () => {
    if (!revokeConfirmItem?.id) return;
    const itemToRevoke = revokeConfirmItem;
    setRevokeConfirmItem(null);
    await handleRevoke(itemToRevoke);
  }, [revokeConfirmItem, handleRevoke]);

  const handleExtend = useCallback(
    async (targetItem) => {
      const item = targetItem ?? selectedItemForDrawer;
      if (!item?.id) return;
      if (item.status === 'EXPIRED') {
        toast.error(
          t('platform.desktopNotifications.cannotExtendExpired', {
            defaultValue: 'Muddati tugagan xabarni uzaytirib bo‘lmaydi',
          })
        );
        return;
      }
      try {
        const currentExpiry = item.expiresAt ? new Date(item.expiresAt).getTime() : Date.now();
        const baseTime = Math.max(Date.now(), currentExpiry);
        const newExpiry = new Date(baseTime + 24 * 3600 * 1000).toISOString();
        await platformDesktopNotificationsApi.extend(item.id, {
          expiresAt: newExpiry,
          expiresInHours: 24,
        });
        toast.success(
          t('platform.desktopNotifications.extended', {
            defaultValue: 'Xabar muddati 24 soatga uzaytirildi',
          })
        );
        queryClient.invalidateQueries({ queryKey: ['platform-desktop-notifications'] });
      } catch (e) {
        toast.error(
          e.response?.data?.message ??
            t('platform.desktopNotifications.extendFailed', {
              defaultValue: 'Muddatni uzaytirib bo‘lmadi',
            })
        );
      }
    },
    [selectedItemForDrawer, t, queryClient]
  );

  return {
    selectedItemForDrawer,
    setSelectedItemForDrawer,
    revokeConfirmItem,
    setRevokeConfirmItem,
    handleDuplicate,
    handleRevoke,
    handleRevokePrompt,
    handleConfirmRevoke,
    handleExtend,
  };
}
