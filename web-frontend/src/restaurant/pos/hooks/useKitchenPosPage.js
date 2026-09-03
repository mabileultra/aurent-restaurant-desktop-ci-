import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { useAuthStore } from '../../../store/authStore';
import { groupTicketsByStatus, NEXT_TICKET_STATUS } from '../utils/kitchenBoard';

export function useKitchenPosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const workspace = useRestaurantWorkspaceStore();
  const canAdvance = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'COOK';

  const ticketsQuery = useQuery({
    queryKey: ['rst-kitchen-tickets', workspace.storeId],
    queryFn: () => rstKitchenApi.listTickets(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
    refetchInterval: 5_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ ticketId, status }) => rstKitchenApi.updateTicketStatus(ticketId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rst-kitchen-tickets', workspace.storeId] }),
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.kitchen.statusFailed')),
  });

  const tickets = ticketsQuery.data ?? [];
  const columns = groupTicketsByStatus(tickets);

  return {
    t,
    workspace,
    columns,
    isLoading: workspace.isLoading || ticketsQuery.isLoading,
    isError: ticketsQuery.isError,
    canAdvance,
    canAdmin: user?.role === 'ADMIN' || user?.role === 'MANAGER',
    advance: (ticket) => {
      const next = NEXT_TICKET_STATUS[ticket.status];
      if (!next) return;
      statusMutation.mutate({ ticketId: ticket.id, status: next });
    },
    advancing: statusMutation.isPending,
  };
}
