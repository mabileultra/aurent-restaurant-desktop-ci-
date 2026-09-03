import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../../api/product.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

export function useStockAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();

  const stockQuery = useQuery({
    queryKey: ['rst-stock', workspace.storeId],
    queryFn: () => productApi.getAll({
      storeId: workspace.storeId,
      activeOnly: true,
      size: 100,
    }).then((r) => r.data?.content ?? []),
    enabled: workspace.storeId != null,
  });

  return {
    t,
    workspace,
    items: stockQuery.data ?? [],
    isLoading: stockQuery.isLoading,
    isError: stockQuery.isError,
  };
}
