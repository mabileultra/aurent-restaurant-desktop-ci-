import { useNetworkStore, ConnectionStatus } from '../store/networkStore';
import { useTranslation } from 'react-i18next';

/**
 * Internetsiz yoki server ishlamayotganda saqlash/o'chirish/yuborish
 * amallarini bloklash va foydalanuvchiga tooltip chiqarish hooki (P0/P1)
 */
export function useOnlineActionGuard({ statusOverride } = {}) {
  const { t } = useTranslation();
  const storeStatus = useNetworkStore((s) => s.status);
  const status = statusOverride ?? (typeof window === 'undefined' ? useNetworkStore.getState().status : storeStatus);

  const isOffline = status === ConnectionStatus.OFFLINE;
  const isServerDown = status === ConnectionStatus.SERVER_DOWN;
  const isChecking = status === ConnectionStatus.CHECKING;
  const isActionBlocked = isOffline || isServerDown || isChecking;

  const blockReason = isOffline
    ? t('errors.wifiOfflineShort', { defaultValue: 'Internet yo’q' })
    : isServerDown
    ? t('errors.serverDownShort', { defaultValue: 'Server bilan aloqa yo’q' })
    : isChecking
    ? t('errors.networkCheckingShort', { defaultValue: 'Aloqa tekshirilmoqda…' })
    : '';

  return {
    isActionBlocked,
    blockReason,
    isOffline,
    isServerDown,
    isChecking,
  };
}
