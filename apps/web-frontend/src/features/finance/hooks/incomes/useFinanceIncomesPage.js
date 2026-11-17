import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { financeApi } from '../../../../api';
import { useTenantScope } from '../../../../hooks/useTenantScope';
import { isEditableIncome } from '../../utils/shared/financeRowRules';
import { useFinanceDateFilters } from '../shared/useFinanceDateFilters';
import { useFinanceListPagination } from '../shared/useFinanceListPagination';
import { DEFAULT_FINANCE_CURRENCY } from '../../utils/shared/financeCurrencies';
import { useFinanceRowSelection } from '../shared/useFinanceRowSelection';
import {
  useFinanceRecordDelete,
  useFinanceSelectableRows,
} from '../shared/useFinanceRecordDelete';
import { useFinanceRecordForm } from '../shared/useFinanceRecordForm';

const EMPTY_INCOME_FORM = {
  amount: '',
  currency: DEFAULT_FINANCE_CURRENCY,
  accountId: '',
  incomeCategoryId: '',
  paymentMethod: 'CASH',
  comment: '',
  transactionDate: '',
};

export function useFinanceIncomesPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const { page, setPage, pageSize, setPageSize } = useFinanceListPagination(20);
  const filters = useFinanceDateFilters({ withPaymentMethod: true });
  const [viewTab, setViewTab] = useState('revenue');

  useEffect(() => {
    setPage(0);
  }, [filters.from, filters.to, filters.paymentMethod, viewTab, setPage]);

  const listParams = {
    page,
    size: pageSize,
    ...filters.queryParams,
    excludeSale: viewTab === 'operations',
  };

  const incomesQuery = useQuery({
    queryKey: tenantKey('finance-incomes', viewTab, page, pageSize, filters.queryParams),
    queryFn: () => financeApi.incomes.list(listParams).then((r) => r.data),
    enabled: tenantReady && viewTab !== 'revenue',
  });

  const revenueQuery = useQuery({
    queryKey: tenantKey('finance-incomes-revenue', filters.from, filters.to),
    queryFn: () => financeApi.incomes.dailyRevenue({
      from: filters.from || undefined,
      to: filters.to || undefined,
    }).then((r) => r.data),
    enabled: tenantReady && viewTab === 'revenue',
  });

  const rows = incomesQuery.data?.content ?? [];
  const selection = useFinanceRowSelection(rows, {
    resetKey: `${page}-${pageSize}-${filters.from}-${filters.to}-${filters.paymentMethod}`,
  });

  const {
    selectableRows,
    selectedDeletable,
    allSelectableSelected,
    toggleSelectAllEditable,
  } = useFinanceSelectableRows(rows, isEditableIncome, selection);

  const accountsQuery = useQuery({
    queryKey: tenantKey('finance-accounts'),
    queryFn: () => financeApi.accounts.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const categoriesQuery = useQuery({
    queryKey: tenantKey('finance-income-categories'),
    queryFn: () => financeApi.categories.income().then((r) => r.data),
    enabled: tenantReady,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-incomes') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-incomes-revenue') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-accounts') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-dashboard') });
  };

  const formState = useFinanceRecordForm({
    emptyForm: EMPTY_INCOME_FORM,
    createFn: (p) => financeApi.incomes.create(p),
    updateFn: (id, p) => financeApi.incomes.update(id, p),
    invalidate,
    isEditableFn: isEditableIncome,
    createdToastKey: 'finance.incomes.created',
    updatedToastKey: 'finance.incomes.updated',
    mapRowToForm: (row) => ({
      amount: String(row.amount ?? ''),
      currency: row.currency ?? DEFAULT_FINANCE_CURRENCY,
      accountId: row.accountId ?? '',
      incomeCategoryId: row.incomeCategoryId ?? '',
      paymentMethod: row.paymentMethod ?? 'CASH',
      comment: row.comment ?? '',
      transactionDate: row.transactionDate ?? '',
    }),
    formatSubmitPayload: (f) => ({
      amount: Number(f.amount),
      currency: f.currency || DEFAULT_FINANCE_CURRENCY,
      accountId: f.accountId,
      incomeCategoryId: f.incomeCategoryId,
      paymentMethod: f.paymentMethod,
      comment: f.comment || undefined,
      transactionDate: f.transactionDate || undefined,
    }),
    t,
  });

  const deleteState = useFinanceRecordDelete({
    deleteFn: (id) => financeApi.incomes.delete(id),
    invalidate,
    selection,
    selectedDeletable,
    t,
  });

  const openDelete = (row) => {
    if (!isEditableIncome(row)) return;
    deleteState.setDeleteTarget(row);
  };

  return {
    t,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    viewTab,
    setViewTab,
    incomesQuery,
    revenueQuery,
    revenueRows: revenueQuery.data ?? [],
    accountsQuery,
    categoriesQuery,
    rows,
    selection,
    selectableRows,
    selectedDeletable,
    allSelectableSelected,
    toggleSelectAllEditable,
    modalOpen: formState.modalOpen,
    setModalOpen: formState.setModalOpen,
    editingId: formState.editingId,
    form: formState.form,
    setForm: formState.setForm,
    openEdit: formState.openEdit,
    resetForm: formState.resetForm,
    submit: formState.submit,
    createMutation: formState.createMutation,
    updateMutation: formState.updateMutation,
    openDelete,
    confirmDelete: deleteState.confirmDelete,
    bulkDeleteOpen: deleteState.bulkDeleteOpen,
    setBulkDeleteOpen: deleteState.setBulkDeleteOpen,
    deleteTarget: deleteState.deleteTarget,
    setDeleteTarget: deleteState.setDeleteTarget,
    bulkDeleteMutation: deleteState.bulkDeleteMutation,
    isEditable: isEditableIncome,
  };
}
