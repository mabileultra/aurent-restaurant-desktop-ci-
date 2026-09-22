import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstModifierApi } from '../../api/modifier.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { toastApiError } from '../../../utils/apiError';

const emptyGroup = () => ({ name: '', minSelect: 0, maxSelect: 1, sortOrder: 100 });
const emptyOption = () => ({ name: '', priceDelta: '0' });
const emptyFilters = () => ({ search: '' });

export const MODIFIERS_PAGE_SIZE_OPTIONS = [10, 14, 20];
const DEFAULT_PAGE_SIZE = 14;

export function useModifiersAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [groupForm, setGroupForm] = useState(emptyGroup());
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [optionForm, setOptionForm] = useState(emptyOption());
  const [optionGroupId, setOptionGroupId] = useState(null);
  const [filters, setFilters] = useState(emptyFilters());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const groupsQuery = useQuery({
    queryKey: ['rst-modifiers', workspace.storeId],
    queryFn: () => rstModifierApi.listGroups(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const groups = useMemo(
    () => (groupsQuery.data ?? []).filter((group) => group.active),
    [groupsQuery.data],
  );

  const filteredGroups = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((group) => {
      const optionsText = (group.options ?? []).map((o) => o.name).join(' ');
      return `${group.name} ${optionsText}`.toLowerCase().includes(q);
    });
  }, [groups, filters]);

  const total = filteredGroups.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return filteredGroups.slice(start, start + pageSize);
  }, [filteredGroups, safePage, pageSize]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rst-modifiers', workspace.storeId] });
  };

  const saveGroup = useMutation({
    mutationFn: () => {
      const body = {
        name: groupForm.name,
        minSelect: Number(groupForm.minSelect) || 0,
        maxSelect: Number(groupForm.maxSelect) || 1,
        sortOrder: Number(groupForm.sortOrder) || 100,
      };
      if (editingGroupId) return rstModifierApi.updateGroup(editingGroupId, body);
      return rstModifierApi.createGroup(workspace.storeId, body);
    },
    onSuccess: () => {
      toast.success(t('rst.admin.modifierGroupSaved'));
      setGroupForm(emptyGroup());
      setEditingGroupId(null);
      setPage(0);
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.saveFailed')),
  });

  const saveOption = useMutation({
    mutationFn: () => rstModifierApi.createOption(optionGroupId, {
      name: optionForm.name,
      priceDelta: Number(optionForm.priceDelta) || 0,
    }),
    onSuccess: () => {
      toast.success(t('rst.admin.modifierOptionSaved'));
      setOptionForm(emptyOption());
      setOptionGroupId(null);
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.saveFailed')),
  });

  const deactivateGroup = useMutation({
    mutationFn: (id) => rstModifierApi.deactivateGroup(id),
    onSuccess: () => {
      toast.success(t('rst.admin.modifierGroupDeactivated'));
      if (optionGroupId) setOptionGroupId(null);
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.deleteFailed')),
  });

  const optionGroup = groups.find((group) => group.id === optionGroupId) ?? null;

  return {
    t,
    workspace,
    groups,
    rows,
    filters,
    setFilters,
    resetFilters: () => {
      setFilters(emptyFilters());
      setPage(0);
    },
    page: safePage,
    pageSize,
    total,
    totalPages,
    setPage: (next) => setPage(Math.max(0, Math.min(next, totalPages - 1))),
    setPageSize: (nextSize) => {
      setPageSize(nextSize);
      setPage(0);
    },
    pageSizeOptions: MODIFIERS_PAGE_SIZE_OPTIONS,
    groupForm,
    setGroupForm,
    editingGroupId,
    saveGroup,
    optionForm,
    setOptionForm,
    optionGroupId,
    setOptionGroupId,
    optionGroup,
    saveOption,
    deactivateGroup,
    isLoading: workspace.isLoading || groupsQuery.isLoading,
    startEditGroup: (group) => {
      setEditingGroupId(group.id);
      setGroupForm({
        name: group.name,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        sortOrder: group.sortOrder,
      });
    },
    resetGroup: () => {
      setEditingGroupId(null);
      setGroupForm(emptyGroup());
    },
  };
}
