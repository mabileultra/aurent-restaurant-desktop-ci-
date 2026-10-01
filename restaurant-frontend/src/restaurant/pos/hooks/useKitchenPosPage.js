import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../../api';
import { rstKitchenApi } from '../../api/kitchen.api';
import { rstShiftApi } from '../../api/shift.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { useAuthStore } from '../../../store/authStore';
import { groupTicketsByStatus, NEXT_TICKET_STATUS } from '../utils/kitchenBoard';
import { toastApiError } from '../../../utils/apiError';
import { printKitchenBoardTickets } from '../utils/printKitchenTicket';
import { useStoreFloorSync } from './useStoreFloorSync';

const STATION_FILTER_KEY = 'rst-kds-station-filter';

function displayUserName(user) {
  return user.fullName
    || [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(' ')
    || user.username
    || String(user.id);
}

function readStoredStation(storeId) {
  try {
    const raw = localStorage.getItem(`${STATION_FILTER_KEY}:${storeId}`);
    return raw || 'all';
  } catch {
    return 'all';
  }
}

export function useKitchenPosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const workspace = useRestaurantWorkspaceStore();
  const canAdvance = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'COOK';
  const [stationFilter, setStationFilterState] = useState('all');

  useStoreFloorSync(workspace.storeId, { syncKitchen: true });

  useEffect(() => {
    if (workspace.storeId == null) return;
    setStationFilterState(readStoredStation(workspace.storeId));
  }, [workspace.storeId]);

  const setStationFilter = (value) => {
    setStationFilterState(value);
    if (workspace.storeId != null) {
      try {
        localStorage.setItem(`${STATION_FILTER_KEY}:${workspace.storeId}`, value);
      } catch {
        /* ignore */
      }
    }
  };

  const stationsQuery = useQuery({
    queryKey: ['rst-kitchen-stations', workspace.storeId],
    queryFn: () => rstKitchenApi.listStations(workspace.storeId, true).then((r) => r.data ?? []),
    enabled: workspace.storeId != null,
    staleTime: 60_000,
  });

  const kitchenBoardQuery = useQuery({
    queryKey: ['rst-kitchen-board', workspace.storeId],
    queryFn: () => rstKitchenApi.getKitchenBoard(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
    staleTime: 15_000,
  });
  const kitchenBoardEnabled = kitchenBoardQuery.isError || kitchenBoardQuery.data?.enabled !== false;

  const ticketsQuery = useQuery({
    queryKey: ['rst-kitchen-tickets', workspace.storeId, stationFilter],
    queryFn: () => rstKitchenApi.listTickets(
      workspace.storeId,
      stationFilter !== 'all' ? { stationId: stationFilter } : undefined,
    ).then((r) => r.data),
    enabled: workspace.storeId != null && kitchenBoardEnabled,
    refetchInterval: kitchenBoardEnabled ? 5_000 : false,
  });

  const staffQuery = useQuery({
    queryKey: ['rst-pos-staff', workspace.storeId],
    queryFn: () => userApi.getPosRoster(workspace.storeId).then((r) => r.data ?? []),
    enabled: workspace.storeId != null,
    staleTime: 60_000,
  });

  const shiftQuery = useQuery({
    queryKey: ['rst-shift-current', workspace.storeId],
    queryFn: async () => {
      try {
        const res = await rstShiftApi.current(workspace.storeId);
        return res.status === 204 ? null : (res.data ?? null);
      } catch {
        return null;
      }
    },
    enabled: workspace.storeId != null,
    refetchInterval: 30_000,
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: ({ ticketId, status }) => rstKitchenApi.updateTicketStatus(ticketId, status),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rst-kitchen-tickets', workspace.storeId] });
      if (vars.status === 'SERVED') {
        toast.success(t('rst.kitchen.servedCleared'));
      }
    },
    onError: (err) => toastApiError(err, t('rst.kitchen.statusFailed')),
  });

  const tickets = ticketsQuery.data ?? [];
  const waiterNameById = useMemo(() => {
    const map = new Map();
    for (const row of staffQuery.data ?? []) {
      map.set(String(row.id), displayUserName(row));
    }
    return map;
  }, [staffQuery.data]);

  useEffect(() => {
    const rows = ticketsQuery.data;
    if (!rows?.length) return undefined;
    let cancelled = false;
    printKitchenBoardTickets(rows, t, waiterNameById, workspace.storeId).then((printed) => {
      if (cancelled || !printed?.errors?.length) return;
      toast.error(printed.errors[0]);
    }).catch((err) => {
      if (cancelled) return;
      toast.error(err?.message || t('receipt.printFailed'));
    });
    return () => {
      cancelled = true;
    };
  }, [ticketsQuery.data, t, waiterNameById, workspace.storeId]);
  const columns = groupTicketsByStatus(tickets);

  const stations = stationsQuery.data ?? [];

  return {
    t,
    workspace,
    columns,
    stations,
    stationFilter,
    setStationFilter,
    waiterNameById,
    shift: shiftQuery.data ?? null,
    isLoading: (workspace.storeId == null && workspace.isLoading) || ticketsQuery.isLoading,
    isError: ticketsQuery.isError,
    canAdvance,
    canAdmin: user?.role === 'ADMIN' || user?.role === 'MANAGER',
    kitchenBoardEnabled,
    kitchenBoardLoading: kitchenBoardQuery.isLoading,
    advance: (ticket) => {
      const next = NEXT_TICKET_STATUS[ticket.status];
      if (!next) return;
      statusMutation.mutate({ ticketId: ticket.id, status: next });
    },
    advancing: statusMutation.isPending,
  };
}
