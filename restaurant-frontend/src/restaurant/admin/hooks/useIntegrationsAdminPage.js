import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cashRegisterApi } from '../../../api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { storeSupportsAslMarking } from '../utils/storeAslMarkingSupport';
import { normalizeBusinessTypeCode } from '../../../config/productCatalogConfig';

/**
 * Workspace store + cash registers for integrations settings.
 */
export function useIntegrationsAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const [cashRegisterId, setCashRegisterId] = useState('');

  const store = useMemo(() => {
    const id = workspace.storeId;
    if (id == null) return null;
    return (
      workspace.restaurantStores.find((s) => Number(s.id) === Number(id))
      || workspace.allRestaurantStores?.find((s) => Number(s.id) === Number(id))
      || { id, name: workspace.storeName, businessType: 'RESTAURANT' }
    );
  }, [workspace]);

  const aslSupported = storeSupportsAslMarking(
    normalizeBusinessTypeCode(store?.businessType) || 'RESTAURANT',
  );

  const registersQuery = useQuery({
    queryKey: ['rst-cash-registers', workspace.storeId],
    queryFn: () => cashRegisterApi.getAll({ page: 0, size: 100 }).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const registers = useMemo(() => {
    const content = registersQuery.data?.content ?? [];
    const storeId = Number(workspace.storeId);
    return content.filter((row) => Number(row.storeId) === storeId);
  }, [registersQuery.data, workspace.storeId]);

  const selectedRegisterId = useMemo(() => {
    if (cashRegisterId && registers.some((r) => String(r.id) === String(cashRegisterId))) {
      return Number(cashRegisterId);
    }
    if (registers.length === 1) return Number(registers[0].id);
    return cashRegisterId ? Number(cashRegisterId) : null;
  }, [cashRegisterId, registers]);

  return {
    t,
    workspace,
    store,
    aslSupported,
    registers,
    registersLoading: registersQuery.isLoading,
    registersError: registersQuery.isError,
    cashRegisterId: selectedRegisterId,
    setCashRegisterId,
  };
}
