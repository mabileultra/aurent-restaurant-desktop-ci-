import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { financeApi, supplierApi, userApi } from '../../../../api';
import { useTenantScope } from '../../../../hooks/useTenantScope';
import { isEditableExpense } from '../../utils/shared/financeRowRules';
import { useFinanceDateFilters } from '../shared/useFinanceDateFilters';
import { useFinanceListPagination } from '../shared/useFinanceListPagination';
import { DEFAULT_FINANCE_CURRENCY } from '../../utils/shared/financeCurrencies';
import { useFinanceRowSelection } from '../shared/useFinanceRowSelection';
import {
  useFinanceRecordDelete,
  useFinanceSelectableRows,
} from '../shared/useFinanceRecordDelete';
import { useFinanceRecordForm } from '../shared/useFinanceRecordForm';

const EMPTY_FORM = {
  amount: '',
  currency: DEFAULT_FINANCE_CURRENCY,
  accountId: '',
  expenseCategoryId: '',
  paymentMethod: 'CASH',
  supplierId: '',
  employeeId: '',
  comment: '',
  transactionDate: '',
};

export function useFinanceExpensesPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const { page, setPage, pageSize, setPageSize } = useFinanceListPagination(20);
  const filters = useFinanceDateFilters({ withCategory: true, withPaymentMethod: true });

  useEffect(() => {
    setPage(0);
  }, [filters.from, filters.to, filters.categoryId, filters.paymentMethod, setPage]);

  const expensesQuery = useQuery({
    queryKey: tenantKey('finance-expenses', page, pageSize, filters.queryParams),
    queryFn: () => financeApi.expenses.list({ page, size: pageSize, ...filters.queryParams }).then((r) => r.data),
    enabled: tenantReady,
  });

  const rows = expensesQuery.data?.content ?? [];
  const selection = useFinanceRowSelection(rows, {
    resetKey: `${page}-${pageSize}-${filters.from}-${filters.to}-${filters.categoryId}-${filters.paymentMethod}`,
  });

  const {
    selectableRows,
    selectedDeletable,
    allSelectableSelected,
    toggleSelectAllEditable,
  } = useFinanceSelectableRows(rows, isEditableExpense, selection);

  const accountsQuery = useQuery({
    queryKey: tenantKey('finance-accounts'),
    queryFn: () => financeApi.accounts.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const categoriesQuery = useQuery({
    queryKey: tenantKey('finance-expense-categories'),
    queryFn: () => financeApi.categories.expense().then((r) => r.data),
    enabled: tenantReady,
  });

  const suppliersQuery = useQuery({
    queryKey: tenantKey('finance-suppliers'),
    queryFn: () => supplierApi.getAll({ size: 500 }).then((r) => r.data?.content ?? r.data ?? []),
    enabled: tenantReady,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-expenses') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-accounts') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-dashboard') });
  };

  const formState = useFinanceRecordForm({
    emptyForm: EMPTY_FORM,
    createFn: (p) => financeApi.expenses.create(p),
    updateFn: (id, p) => financeApi.expenses.update(id, p),
    invalidate,
    isEditableFn: isEditableExpense,
    createdToastKey: 'finance.expenses.created',
    updatedToastKey: 'finance.expenses.updated',
    onCreatedSuccess: () => setPage(0),
    mapRowToForm: (row) => ({
      amount: String(row.amount ?? ''),
      currency: row.currency ?? DEFAULT_FINANCE_CURRENCY,
      accountId: row.accountId ?? '',
      expenseCategoryId: row.expenseCategoryId ?? '',
      paymentMethod: row.paymentMethod ?? 'CASH',
      supplierId: row.supplierId ?? '',
      employeeId: row.employeeId ?? '',
      comment: row.comment ?? '',
      transactionDate: row.transactionDate ?? '',
    }),
    formatSubmitPayload: (f) => ({
      amount: Number(f.amount),
      currency: f.currency || DEFAULT_FINANCE_CURRENCY,
      accountId: f.accountId,
      expenseCategoryId: f.expenseCategoryId,
      paymentMethod: f.paymentMethod,
      supplierId: f.supplierId || undefined,
      employeeId: f.employeeId || undefined,
      comment: f.comment || undefined,
      transactionDate: f.transactionDate || undefined,
    }),
    t,
  });

  const usersQuery = useQuery({
    queryKey: tenantKey('finance-users'),
    queryFn: () => userApi.getAll().then((r) => r.data),
    enabled: tenantReady && (formState.modalOpen || expensesQuery.isSuccess),
  });

  const deleteState = useFinanceRecordDelete({
    deleteFn: (id) => financeApi.expenses.delete(id),
    invalidate,
    selection,
    selectedDeletable,
    t,
  });

  const openDelete = (row) => {
    if (!isEditableExpense(row)) return;
    deleteState.setDeleteTarget(row);
  };

  return {
    t,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    expensesQuery,
    accountsQuery,
    categoriesQuery,
    suppliersQuery,
    usersQuery,
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
    isEditable: isEditableExpense,
  };
}
