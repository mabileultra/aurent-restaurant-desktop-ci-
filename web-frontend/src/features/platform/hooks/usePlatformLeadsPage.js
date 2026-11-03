import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformLeadsApi } from '../../../api/platform/leads.api';
import { useAuthStore } from '../../../store/authStore';
import {
  appendLeadTimelineEvent,
  getLeadWaitUrgency,
  resolveCurrentAuthor,
} from '../utils/leadTimelineUtils';
import { calculateLeadCounts, filterAndSortLeads } from '../utils/leadFilterUtils';
import { convertLeadToCompanyTransaction } from '../utils/leadConvertService';
import { notifyConvertResult } from '../utils/leadConvertToastUtils';
import { formatApiErrorMessage } from '../../../utils/apiErrorParser';

export function usePlatformLeadsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [leadType, setLeadType] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [convertTargetLead, setConvertTargetLead] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const normalizedSearch = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return undefined;
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (/^[\d\s\-_+()]+$/.test(trimmed) && digitsOnly.length >= 3) {
      return digitsOnly;
    }
    return trimmed;
  }, [search]);

  const queryParams = useMemo(
    () => ({
      page: 0,
      size: 200,
      search: normalizedSearch,
    }),
    [normalizedSearch]
  );

  const { data, isPending } = useQuery({
    queryKey: ['platform-leads', queryParams],
    queryFn: () => platformLeadsApi.list(queryParams).then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['platform-leads-stats'],
    queryFn: () => platformLeadsApi.stats().then((r) => r.data),
  });

  const rawRows = data?.content ?? [];
  const counts = useMemo(() => {
    if (stats) {
      return {
        ALL: stats.total ?? 0,
        NEW: stats.newCount ?? 0,
        IN_PROGRESS: stats.inProgressCount ?? 0,
        DONE: stats.doneCount ?? 0,
        REJECTED: stats.rejectedCount ?? 0,
      };
    }
    return calculateLeadCounts(rawRows);
  }, [stats, rawRows]);
  const rows = useMemo(() => filterAndSortLeads(rawRows, { status, leadType, search }), [rawRows, status, leadType, search]);

  const selectedLead = useMemo(() => {
    if (selectedLeadId) {
      const found = rows.find((r) => r.id === selectedLeadId);
      if (found) return found;
    }
    return rows[0] || null;
  }, [rows, selectedLeadId]);

  const unansweredCount = stats?.unansweredCount ?? rawRows.filter((r) => getLeadWaitUrgency(r).isUrgent).length;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['platform-leads'] });
    qc.invalidateQueries({ queryKey: ['platform-leads-stats'] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, payload, asComment }) =>
      asComment ? platformLeadsApi.addComment(id, payload) : platformLeadsApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.leads.saved', { defaultValue: 'Ariza yangilandi' }));
    },
    onError: (e) => toast.error(formatApiErrorMessage(e, t('platform.saveFailed'))),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => platformLeadsApi.delete(id),
    onSuccess: () => {
      invalidate();
      setSelectedLeadId(null);
      setViewMode('split');
      toast.success(t('platform.leads.deleted', { defaultValue: 'Ariza o\'chirildi' }));
    },
    onError: (e) => toast.error(formatApiErrorMessage(e, t('platform.saveFailed'))),
  });

  const convertMutation = useMutation({
    mutationFn: async (payload) => {
      const lead = rawRows.find((r) => r.id === payload.leadId);
      const author = resolveCurrentAuthor(useAuthStore.getState().user);
      return convertLeadToCompanyTransaction({
        ...payload,
        lead,
        author,
      });
    },
    meta: { suppressGlobalError: true },
    onSuccess: (res) => {
      invalidate();
      setViewMode('split');
      setConvertTargetLead(null);
      if (res?.credentials) {
        setCreatedCredentials(res.credentials);
      }
      notifyConvertResult(res);
    },
    onError: (e) => toast.error(formatApiErrorMessage(e, t('platform.saveFailed'))),
  });

  const handleStatusChange = (leadId, nextStatus) => {
    const lead = rawRows.find((r) => r.id === leadId);
    if (!lead || lead.status === nextStatus) return;
    const author = resolveCurrentAuthor(useAuthStore.getState().user);
    const note = appendLeadTimelineEvent(
      lead.managerNote,
      {
        type: 'status_change',
        author,
        text: `Holat: ${t(`platform.leads.statuses.${lead.status}`, { defaultValue: lead.status })} → ${t(`platform.leads.statuses.${nextStatus}`, { defaultValue: nextStatus })}`,
      },
      { leadCreatedAt: lead.createdAt }
    );
    updateMutation.mutate({ id: leadId, payload: { status: nextStatus, managerNote: note } });
  };

  const handleAddComment = (commentText) => {
    if (!selectedLead || !commentText.trim()) return;
    updateMutation.mutate({
      id: selectedLead.id,
      payload: { text: commentText.trim() },
      asComment: true,
    });
  };

  const handleStartConvert = (lead) => {
    setConvertTargetLead(lead);
    setViewMode('convert_company');
  };

  const handleSelectLeadMobile = (lead) => {
    setSelectedLeadId(lead.id);
    setViewMode('mobile_detail');
  };

  return {
    t,
    search,
    setSearch,
    status,
    setStatus,
    leadType,
    setLeadType,
    rows,
    isPending,
    counts,
    unansweredCount,
    selectedLead,
    selectedLeadId,
    setSelectedLeadId,
    viewMode,
    setViewMode,
    convertTargetLead,
    createdCredentials,
    dismissCredentials: () => setCreatedCredentials(null),
    handleStatusChange,
    handleAddComment,
    handleDeleteLead: deleteMutation.mutate,
    handleStartConvert,
    handleSelectLeadMobile,
    handleConvertSubmit: convertMutation.mutate,
    isSaving: updateMutation.isPending || convertMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
