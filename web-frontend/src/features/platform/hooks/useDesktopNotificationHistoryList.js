import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformDesktopNotificationsApi } from '../../../api';
import {
  enrichDesktopNotificationHistory,
  filterDesktopNotificationHistory,
} from './enrichDesktopNotificationHistory';

/**
 * Manages history query fetching, enrichment, filtering, and search state
 * for desktop notifications, keeping page hook under 200 lines.
 */
export function useDesktopNotificationHistoryList({ t }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const historyQuery = useQuery({
    queryKey: ['platform-desktop-notifications'],
    queryFn: () => platformDesktopNotificationsApi.list().then((r) => r.data),
  });

  const enrichedHistory = useMemo(
    () => enrichDesktopNotificationHistory(
      historyQuery.data,
      t('platform.desktopNotifications.targetAll', { defaultValue: 'Barcha kassalar' })
    ),
    [historyQuery.data, t]
  );

  const filteredHistory = useMemo(
    () => filterDesktopNotificationHistory(enrichedHistory, searchQuery, statusFilter),
    [enrichedHistory, searchQuery, statusFilter]
  );

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    history: filteredHistory,
    totalHistoryCount: enrichedHistory.length,
    historyLoading: historyQuery.isLoading,
  };
}
