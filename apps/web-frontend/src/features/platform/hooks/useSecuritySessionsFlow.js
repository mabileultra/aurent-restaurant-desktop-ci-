import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformSecurityApi } from '../../../api';

/**
 * Xavfsizlik "Kirishlar va seanslar" tabi — faol seanslar API.
 */
export function useSecuritySessionsFlow() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [pendingCloseSession, setPendingCloseSession] = useState(null);
  const [isCloseAllPending, setIsCloseAllPending] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['platform-security-sessions'],
    queryFn: () => platformSecurityApi.listSessions().then((r) => (Array.isArray(r.data) ? r.data : [])),
  });

  const attempts = useMemo(() => [], []);

  const revokeMutation = useMutation({
    mutationFn: (sessionId) => platformSecurityApi.revokeSession(sessionId),
    onSuccess: () => {
      toast.success('Seans yopildi');
      setPendingCloseSession(null);
      qc.invalidateQueries({ queryKey: ['platform-security-sessions'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Seansni yopib bo‘lmadi'),
  });

  const revokeOthersMutation = useMutation({
    mutationFn: () => platformSecurityApi.revokeOtherSessions().then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`Yopilgan seanslar: ${data?.revoked ?? 0}`);
      setIsCloseAllPending(false);
      qc.invalidateQueries({ queryKey: ['platform-security-sessions'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Seanslarni yopib bo‘lmadi'),
  });

  return {
    sessions,
    attempts,
    filter,
    setFilter,
    isLoading,
    pendingCloseSession,
    requestCloseSession: (session) => setPendingCloseSession(session),
    confirmCloseSession: () => {
      if (pendingCloseSession?.id) revokeMutation.mutate(pendingCloseSession.id);
    },
    cancelCloseSession: () => setPendingCloseSession(null),
    isCloseAllPending,
    requestCloseAllOthers: () => setIsCloseAllPending(true),
    confirmCloseAllOthers: () => revokeOthersMutation.mutate(),
    cancelCloseAllOthers: () => setIsCloseAllPending(false),
    isRevoking: revokeMutation.isPending || revokeOthersMutation.isPending,
  };
}
