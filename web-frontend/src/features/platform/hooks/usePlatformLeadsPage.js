import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformLeadsApi } from '../../../api/platform/leads.api';
import { companyApi } from '../../../api/company.api';
import { appendLeadTimelineEvent, getLeadWaitUrgency } from '../utils/leadFormatUtils';

export function usePlatformLeadsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [leadType, setLeadType] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'convert_company' | 'mobile_detail'
  const [convertTargetLead, setConvertTargetLead] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: 0,
      size: 100,
      search: search.trim() || undefined,
      status: status || undefined,
    }),
    [search, status]
  );

  const { data, isPending } = useQuery({
    queryKey: ['platform-leads', queryParams],
    queryFn: () => platformLeadsApi.list(queryParams).then((r) => r.data),
  });

  const rawRows = data?.content ?? [];

  // Filter by leadType if chosen
  const rows = useMemo(() => {
    let list = rawRows;
    if (leadType) {
      list = list.filter((r) => r.leadType === leadType);
    }
    // Sort urgent NEW leads to top as requested in the design
    return [...list].sort((a, b) => {
      const uA = getLeadWaitUrgency(a).isUrgent ? 1 : 0;
      const uB = getLeadWaitUrgency(b).isUrgent ? 1 : 0;
      if (uA !== uB) return uB - uA;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [rawRows, leadType]);

  // Selected lead object
  const selectedLead = useMemo(() => {
    if (selectedLeadId) {
      const found = rows.find((r) => r.id === selectedLeadId);
      if (found) return found;
    }
    return rows[0] || null;
  }, [rows, selectedLeadId]);

  // Status counts
  const counts = useMemo(() => {
    const res = { ALL: rawRows.length, NEW: 0, IN_PROGRESS: 0, DONE: 0, REJECTED: 0 };
    rawRows.forEach((r) => {
      if (r.status && typeof res[r.status] === 'number') {
        res[r.status] += 1;
      }
    });
    return res;
  }, [rawRows]);

  // Unanswered count for SLA header
  const unansweredCount = useMemo(() => {
    return rawRows.filter((r) => getLeadWaitUrgency(r).isUrgent).length;
  }, [rawRows]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['platform-leads'] });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => platformLeadsApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.leads.saved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => platformLeadsApi.delete(id),
    onSuccess: () => {
      invalidate();
      setSelectedLeadId(null);
      setViewMode('split');
      toast.success(t('platform.leads.deleted'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const convertMutation = useMutation({
    mutationFn: async ({ leadId, company, markDone }) => {
      await companyApi.create(company);
      if (markDone) {
        const lead = rawRows.find((r) => r.id === leadId);
        const note = appendLeadTimelineEvent(lead?.managerNote, {
          type: 'status_change',
          author: 'Administrator',
          text: `Kompaniyaga aylantirildi: «${company.name}». Holat: Yakunlangan`,
        });
        await platformLeadsApi.update(leadId, { status: 'DONE', managerNote: note });
      }
    },
    onSuccess: () => {
      invalidate();
      setViewMode('split');
      setConvertTargetLead(null);
      toast.success(t('platform.leads.companyCreated', { defaultValue: 'Kompaniya muvaffaqiyatli yaratildi' }));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const handleStatusChange = (leadId, nextStatus) => {
    const lead = rawRows.find((r) => r.id === leadId);
    if (!lead || lead.status === nextStatus) return;
    const note = appendLeadTimelineEvent(lead.managerNote, {
      type: 'status_change',
      author: 'Administrator',
      text: `Holat: ${t(`platform.leads.statuses.${lead.status}`)} → ${t(`platform.leads.statuses.${nextStatus}`)}`,
    });
    updateMutation.mutate({ id: leadId, payload: { status: nextStatus, managerNote: note } });
  };

  const handleAddComment = (commentText) => {
    if (!selectedLead || !commentText.trim()) return;
    const note = appendLeadTimelineEvent(selectedLead.managerNote, {
      type: 'comment',
      author: 'Administrator',
      text: commentText.trim(),
    });
    updateMutation.mutate({ id: selectedLead.id, payload: { managerNote: note } });
  };

  const handleDeleteLead = (id) => {
    if (!window.confirm(t('platform.leads.deleteConfirm'))) return;
    deleteMutation.mutate(id);
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
    handleStatusChange,
    handleAddComment,
    handleDeleteLead,
    handleStartConvert,
    handleSelectLeadMobile,
    handleConvertSubmit: convertMutation.mutate,
    isSaving: updateMutation.isPending || convertMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
