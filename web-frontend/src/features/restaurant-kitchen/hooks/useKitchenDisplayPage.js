import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { restaurantApi, storeApi } from '../../../api';
import { normalizeBusinessTypeCode } from '../../../config/productCatalogConfig';
import { useAuthStore } from '../../../store/authStore';
import { useKitchenSeenState } from './useKitchenSeenState';
import {
  buildDepartmentCardStats,
  filterActiveTickets,
  groupTicketsByDepartment,
} from '../utils/kitchenDepartmentStats';

const MANAGE_ROLES = new Set(['ADMIN', 'MANAGER']);

export function useKitchenDisplayPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const storeIds = user?.storeIds ?? [];
  const [storeId, setStoreId] = useState(storeIds.length === 1 ? String(storeIds[0]) : '');
  const [tabFilter, setTabFilter] = useState('ALL');
  const [openedDepartment, setOpenedDepartment] = useState(null);
  const [search, setSearch] = useState('');

  const canManageDepartments = MANAGE_ROLES.has(user?.role);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const restaurantStores = useMemo(
    () => stores.filter((s) => normalizeBusinessTypeCode(s.businessType) === 'RESTAURANT'),
    [stores],
  );

  const effectiveStoreId = storeId || (restaurantStores.length === 1 ? String(restaurantStores[0].id) : '');

  const departmentsQuery = useQuery({
    queryKey: ['kitchen-departments'],
    queryFn: () => restaurantApi.listKitchenDepartments().then((r) => r.data),
  });

  const departmentLabelByValue = useMemo(() => {
    const map = new Map();
    (departmentsQuery.data ?? []).forEach((dep) => map.set(dep.value, dep.label));
    return map;
  }, [departmentsQuery.data]);

  const ticketsQuery = useQuery({
    queryKey: ['kitchen-tickets', effectiveStoreId],
    queryFn: () => restaurantApi.listKitchenTickets(Number(effectiveStoreId)).then((r) => r.data),
    enabled: !!effectiveStoreId,
    refetchInterval: 5_000,
  });

  const activeTickets = useMemo(
    () => filterActiveTickets(ticketsQuery.data ?? []),
    [ticketsQuery.data],
  );

  const ticketsByDepartment = useMemo(
    () => groupTicketsByDepartment(ticketsQuery.data ?? []),
    [ticketsQuery.data],
  );

  const { getUnseenCount, markDepartmentSeen } = useKitchenSeenState(effectiveStoreId);

  const departmentTabs = useMemo(() => {
    const fromBook = (departmentsQuery.data ?? []).map((dep) => dep.value);
    const fromTickets = activeTickets.map((ticket) => ticket.kitchenDepartment || 'GENERAL');
    const merged = new Set([...fromBook, ...fromTickets]);
    return ['ALL', ...Array.from(merged).sort()];
  }, [departmentsQuery.data, activeTickets]);

  const resolveDepartmentLabel = (value) => {
    if (value === 'ALL') return t('restaurantKitchen.allDepartments');
    return departmentLabelByValue.get(value) ?? value;
  };

  const departmentCards = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return (departmentsQuery.data ?? [])
      .filter((dep) => {
        if (tabFilter !== 'ALL' && dep.value !== tabFilter) return false;
        if (!searchLower) return true;
        return dep.label.toLowerCase().includes(searchLower)
          || dep.value.toLowerCase().includes(searchLower);
      })
      .map((department) => {
        const tickets = ticketsByDepartment.get(department.value) ?? [];
        return {
          department,
          stats: buildDepartmentCardStats(tickets),
          unseenCount: getUnseenCount(department.value, tickets),
        };
      });
  }, [departmentsQuery.data, tabFilter, search, ticketsByDepartment, getUnseenCount]);

  const openedTickets = useMemo(() => {
    if (!openedDepartment) return [];
    return ticketsByDepartment.get(openedDepartment) ?? [];
  }, [openedDepartment, ticketsByDepartment]);

  const statusMutation = useMutation({
    mutationFn: ({ ticketId, status }) => restaurantApi.updateKitchenTicketStatus(ticketId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kitchen-tickets', effectiveStoreId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantKitchen.updateFailed')),
  });

  const advanceStatus = (ticket) => {
    const current = ticket.status;
    if (current === 'PENDING') {
      statusMutation.mutate({ ticketId: ticket.id, status: 'IN_PROGRESS' });
      return;
    }
    if (current === 'IN_PROGRESS') {
      statusMutation.mutate({ ticketId: ticket.id, status: 'READY' });
      return;
    }
    if (current === 'READY') {
      statusMutation.mutate({ ticketId: ticket.id, status: 'SERVED' });
    }
  };

  const openDepartment = (departmentValue) => {
    const tickets = ticketsByDepartment.get(departmentValue) ?? [];
    markDepartmentSeen(departmentValue, tickets);
    setOpenedDepartment(departmentValue);
  };

  const closeDepartment = () => {
    setOpenedDepartment(null);
  };

  return {
    t,
    restaurantStores,
    storeId: effectiveStoreId,
    setStoreId,
    tabFilter,
    setTabFilter,
    openedDepartment,
    openDepartment,
    closeDepartment,
    departmentTabs,
    resolveDepartmentLabel,
    departmentsQuery,
    canManageDepartments,
    ticketsQuery,
    activeTickets,
    departmentCards,
    openedTickets,
    search,
    setSearch,
    advanceStatus,
    statusMutation,
  };
}
