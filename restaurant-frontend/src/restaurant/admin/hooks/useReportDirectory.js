import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../../api';
import { rstFloorApi } from '../../api/floor.api';
import { staffNameById } from '../utils/receiptJournal';

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

/** Staff names (identity-service) and halls used by every restaurant report filter. */
export function useReportDirectory(storeId, t) {
  const staffQuery = useQuery({
    queryKey: ['rst-report-staff'],
    queryFn: () => userApi.getAll().then((r) => asList(r.data)),
    staleTime: 5 * 60_000,
  });

  const hallsQuery = useQuery({
    queryKey: ['rst-report-halls', storeId],
    queryFn: () => rstFloorApi.listHalls(storeId).then((r) => asList(r.data)),
    enabled: storeId != null,
    staleTime: 5 * 60_000,
  });

  const nameById = useMemo(() => staffNameById(staffQuery.data), [staffQuery.data]);

  const waiterOptions = useMemo(() => [
    { value: '', label: t('rst.reports.journal.allWaiters') },
    ...(staffQuery.data ?? [])
      .filter((u) => u.role === 'WAITER')
      .map((u) => ({ value: String(u.id), label: u.fullName || u.username })),
  ], [staffQuery.data, t]);

  const hallOptions = useMemo(() => [
    { value: '', label: t('rst.reports.journal.allHalls') },
    ...(hallsQuery.data ?? []).map((h) => ({ value: String(h.id), label: h.name })),
  ], [hallsQuery.data, t]);

  return { nameById, waiterOptions, hallOptions };
}
