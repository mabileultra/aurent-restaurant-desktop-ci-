import { useQuery } from '@tanstack/react-query';
import { loadFiscalCapabilities } from '../../services/fiscal';
import { FISCAL_CASHIER_CAPS_KEY } from './resolveCashierFiscalTheme';

/** Статус фискального провайдера кассы. Не Multikassa API. */
export function useFiscalCashierStatus({ storeId, cashRegisterId, enabled = true }) {
  return useQuery({
    queryKey: [FISCAL_CASHIER_CAPS_KEY, storeId, cashRegisterId],
    queryFn: () => loadFiscalCapabilities(storeId, cashRegisterId, {
      allowLoadFailureAsDisabled: true,
    }),
    enabled: enabled && storeId != null,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
