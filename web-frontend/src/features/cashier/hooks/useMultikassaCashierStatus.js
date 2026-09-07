import { useQuery } from '@tanstack/react-query';
import { loadMultikassaCapabilities } from '../../../services/multikassa';

/**
 * Статус Multikassa для текущей смены кассы (чтобы кассир видел, будет ли QR).
 */
export function useMultikassaCashierStatus({ storeId, cashRegisterId, enabled = true }) {
  return useQuery({
    queryKey: ['multikassa-cashier-caps', storeId, cashRegisterId],
    queryFn: () => loadMultikassaCapabilities(storeId, cashRegisterId, {
      allowLoadFailureAsDisabled: true,
    }),
    enabled: enabled && storeId != null,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function describeMultikassaStatus(caps, t) {
  if (!caps) return { tone: 'muted', label: t('cashRegisters.multikassa.statusUnknown') };
  if (caps.loadFailed) {
    return { tone: 'warn', label: t('cashRegisters.multikassa.statusLoadFailed') };
  }
  if (!caps.enabled) {
    return { tone: 'muted', label: t('cashRegisters.multikassa.statusOff') };
  }
  if (!String(caps.terminalId || '').trim()) {
    return { tone: 'danger', label: t('cashRegisters.multikassa.statusNoTerminal') };
  }
  const base = String(caps.baseUrl || '');
  const local = /localhost|127\.0\.0\.1/i.test(base);
  const httpsPage = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const desktop = typeof window !== 'undefined' && window.desktopCashier?.isDesktop;
  if (local && httpsPage && !desktop) {
    return { tone: 'danger', label: t('cashRegisters.multikassa.statusBrowserLocalhost') };
  }
  return { tone: 'ok', label: t('cashRegisters.multikassa.statusOn') };
}
