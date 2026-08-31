import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformLeadsApi } from '../../../api/platform/leads.api';

export const PLATFORM_LEADS_PAGE_SIZE = 20;
export const PLATFORM_LEADS_PAGE_SIZE_OPTIONS = [10, 20, 50];

const LEAD_STATUSES = ['', 'NEW', 'IN_PROGRESS', 'DONE', 'REJECTED'];

export function usePlatformLeadsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PLATFORM_LEADS_PAGE_SIZE);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      status: status || undefined,
    }),
    [page, pageSize, search, status]
  );

  const { data, isPending } = useQuery({
    queryKey: ['platform-leads', params],
    queryFn: () => platformLeadsApi.list(params).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => platformLeadsApi.update(id, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['platform-leads'] });
      setSelectedLead(res.data);
      toast.success(t('platform.leads.saved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const openDetail = (row) => {
    setSelectedLead(row);
    setEditStatus(row.status ?? 'NEW');
    setEditNote(row.managerNote ?? '');
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedLead(null);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleStatusFilter = (value) => {
    setStatus(value);
    setPage(0);
  };

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setPage(0);
  };

  const saveDetail = () => {
    if (!selectedLead) return;
    updateMutation.mutate({
      id: selectedLead.id,
      payload: {
        status: editStatus,
        managerNote: editNote,
      },
    });
  };

  return {
    t,
    search,
    status,
    statusOptions: LEAD_STATUSES,
    page,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,
    rows,
    isPending,
    total,
    totalPages,
    handleSearchChange,
    handleStatusFilter,
    detailOpen,
    selectedLead,
    editStatus,
    setEditStatus,
    editNote,
    setEditNote,
    openDetail,
    closeDetail,
    saveDetail,
    isSaving: updateMutation.isPending,
  };
}
