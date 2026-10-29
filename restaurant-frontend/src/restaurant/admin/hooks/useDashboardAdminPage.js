import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { productApi, userApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { rstAnalyticsApi } from '../../api/analytics.api';
import { rstFloorApi } from '../../api/floor.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { dashboardQueryParams } from '../utils/dashboardPeriod';
import { resolveDashboardQuickActions } from '../utils/dashboardQuickActions';

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function onlineRefetchMs(onlineMs) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  return onlineMs;
}

export function useDashboardAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState('TODAY');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [hallId, setHallId] = useState('');
  const [waiterId, setWaiterId] = useState('');
  const [topMode, setTopMode] = useState('qty');

  const params = useMemo(
    () => dashboardQueryParams(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  const dashQuery = useQuery({
    queryKey: ['rst-dashboard', workspace.storeId, params],
    queryFn: () => rstAnalyticsApi.dashboard(workspace.storeId, params).then((r) => r.data),
    enabled: workspace.storeId != null,
    refetchInterval: onlineRefetchMs(30_000),
    retry: 1,
  });

  const hallsQuery = useQuery({
    queryKey: ['rst-dashboard-halls', workspace.storeId],
    queryFn: () => rstFloorApi.listHalls(workspace.storeId).then((r) => normalizeList(r.data)),
    enabled: workspace.storeId != null,
    retry: 1,
  });

  // Soft extras — never block the main dashboard if staff/stock endpoints glitch offline.
  const staffQuery = useQuery({
    queryKey: ['rst-dashboard-staff'],
    queryFn: () => userApi.getAll().then((r) => normalizeList(r.data)).catch(() => []),
    staleTime: 60_000,
    retry: false,
  });

  const stockQuery = useQuery({
    queryKey: ['rst-dashboard-low-stock', workspace.storeId],
    queryFn: () => productApi
      .getLowStock(workspace.storeId)
      .then((r) => normalizeList(r.data))
      .catch(() => []),
    enabled: workspace.storeId != null,
    refetchInterval: onlineRefetchMs(60_000),
    retry: false,
  });

  const waiters = useMemo(
    () => (staffQuery.data ?? []).filter((u) => u.role === 'WAITER' && u.active !== false),
    [staffQuery.data],
  );

  const waiterNameById = useMemo(() => {
    const map = new Map();
    for (const u of staffQuery.data ?? []) {
      const id = String(u.id);
      map.set(id, u.fullName || u.username || id.slice(0, 8));
    }
    return map;
  }, [staffQuery.data]);

  const recentOrders = useMemo(() => {
    const rows = dashQuery.data?.recentOrders ?? [];
    if (!waiterId) return rows;
    return rows.filter((row) => String(row.waiterUserId || '') === String(waiterId));
  }, [dashQuery.data?.recentOrders, waiterId]);

  const liveTables = useMemo(() => {
    const rows = dashQuery.data?.liveTables ?? [];
    if (!hallId) return rows;
    return rows;
  }, [dashQuery.data?.liveTables, hallId]);

  const quickActions = useMemo(
    () => resolveDashboardQuickActions(user?.role),
    [user?.role],
  );

  return {
    t,
    workspace,
    user,
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    hallId,
    setHallId,
    waiterId,
    setWaiterId,
    topMode,
    setTopMode,
    dashQuery,
    halls: hallsQuery.data ?? [],
    waiters,
    waiterNameById,
    stockAlerts: (stockQuery.data ?? []).slice(0, 8),
    stockLoading: stockQuery.isLoading,
    recentOrders,
    liveTables,
    quickActions,
    data: dashQuery.data
      ? { ...dashQuery.data, liveTables }
      : dashQuery.data,
  };
}
