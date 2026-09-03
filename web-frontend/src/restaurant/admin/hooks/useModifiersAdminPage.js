import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstModifierApi } from '../../api/modifier.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

const emptyGroup = () => ({ name: '', minSelect: 0, maxSelect: 1, sortOrder: 100 });
const emptyOption = () => ({ name: '', priceDelta: '0' });

export function useModifiersAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [groupForm, setGroupForm] = useState(emptyGroup());
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [optionForm, setOptionForm] = useState(emptyOption());
  const [optionGroupId, setOptionGroupId] = useState(null);

  const groupsQuery = useQuery({
    queryKey: ['rst-modifiers', workspace.storeId],
    queryFn: () => rstModifierApi.listGroups(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

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
      qc.invalidateQueries({ queryKey: ['rst-modifiers', workspace.storeId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
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
      qc.invalidateQueries({ queryKey: ['rst-modifiers', workspace.storeId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
  });

  const deactivateGroup = useMutation({
    mutationFn: (id) => rstModifierApi.deactivateGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rst-modifiers', workspace.storeId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.deleteFailed')),
  });

  return {
    t,
    workspace,
    groups: (groupsQuery.data ?? []).filter((group) => group.active),
    groupForm,
    setGroupForm,
    editingGroupId,
    saveGroup,
    optionForm,
    setOptionForm,
    optionGroupId,
    setOptionGroupId,
    saveOption,
    deactivateGroup,
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
