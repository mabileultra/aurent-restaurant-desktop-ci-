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

  const queryParams = useMemo(
    () => ({
      page: 0,
      size: 200,
      search: search.trim() || undefined,
    }),
    [search]
  );

  const { data, isPending } = useQuery({
    queryKey: ['platform-leads', queryParams],
    queryFn: () => platformLeadsApi.list(queryParams).then((r) => r.data),
  });

  const rawRows = data?.content ?? [];
  const counts = useMemo(() => calculateLeadCounts(rawRows), [rawRows]);
  const rows = useMemo(() => filterAndSortLeads(rawRows, { status, leadType }), [rawRows, status, leadType]);

  const selectedLead = useMemo(() => {
    if (selectedLeadId) {
      const found = rows.find((r) => r.id === selectedLeadId);
      if (found) return found;
    }
    return rows[0] || null;
  }, [rows, selectedLeadId]);

  const unansweredCount = useMemo(() => {
    return rawRows.filter((r) => getLeadWaitUrgency(r).isUrgent).length;
  }, [rawRows]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['platform-leads'] });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => platformLeadsApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.leads.saved', { defaultValue: 'Ariza yangilandi' }));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => platformLeadsApi.delete(id),
    onSuccess: () => {
      invalidate();
      setSelectedLeadId(null);
      setViewMode('split');
      toast.success(t('platform.leads.deleted', { defaultValue: 'Ariza o\'chirildi' }));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
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
    onSuccess: (res) => {
      invalidate();
      setViewMode('split');
      setConvertTargetLead(null);

      if (res?.credentials) {
        setCreatedCredentials(res.credentials);
      }

      if (res?.storeError && res?.userError) {
        toast.error(`Kompaniya yaratildi, ammo filial (${res.storeError}) va admin (${res.userError}) yaratilmadi`);
      } else if (res?.storeError) {
        toast.error(`Kompaniya va admin yaratildi, ammo filial xatosi: ${res.storeError}`);
      } else if (res?.userError) {
        toast.error(`Kompaniya va filial yaratildi, ammo admin xatosi: ${res.userError}`);
      } else if (res?.leadUpdateError) {
        toast.error(`Kompaniya yaratildi, ammo ariza holati yangilanmadi: ${res.leadUpdateError}`);
      } else {
        toast.success('Kompaniya, filial va admin muvaffaqiyatli yaratildi');
      }
    },
    onError: (e) => toast.error(e.response?.data?.message || e.message || t('platform.saveFailed')),
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
    const author = resolveCurrentAuthor(useAuthStore.getState().user);
    const note = appendLeadTimelineEvent(
      selectedLead.managerNote,
      {
        type: 'comment',
        author,
        text: commentText.trim(),
      },
      { leadCreatedAt: selectedLead.createdAt }
    );
    updateMutation.mutate({ id: selectedLead.id, payload: { managerNote: note } });
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
