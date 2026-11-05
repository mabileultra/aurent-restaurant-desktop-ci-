import { useMemo, useState } from 'react';
import TablePagination from '../../../components/shared/TablePagination';
import TableRowActionsMenu from '../../../components/shared/TableRowActionsMenu';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { BaseButton, BaseModal, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceBulkConfirmModal from '../components/shared/FinanceBulkConfirmModal';
import FinanceBulkToolbar from '../components/shared/FinanceBulkToolbar';
import FinanceExpenseFormFields from '../components/expenses/FinanceExpenseFormFields';
import FinanceListFilters from '../components/shared/FinanceListFilters';
import FinanceRecordDetailModal from '../components/shared/FinanceRecordDetailModal';
import FinanceSelectHeader, { FinanceSelectCell } from '../components/shared/FinanceSelectHeader';
import { useFinanceExpensesPage } from '../hooks/expenses/useFinanceExpensesPage';
import { resolveExpenseCounterpartyLabel } from '../utils/expenses/expenseCounterparty';
import { formatMoney } from '../utils/shared/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/bulk-actions.css';
import '../../../styles/finance/detail-modal.css';
import '../../../styles/finance/counterparty-field.css';

export default function FinanceExpensesPage() {
  const p = useFinanceExpensesPage();
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const deleteCount = p.bulkDeleteOpen ? p.selectedDeletable.length : (p.deleteTarget ? 1 : 0);
  const deletePending = p.bulkDeleteMutation.isPending || p.deleteMutation.isPending;

  const suppliers = p.suppliersQuery.data ?? [];
  const users = p.usersQuery.data ?? [];
  const counterpartyContext = useMemo(
    () => ({ suppliers, users }),
    [suppliers, users],
  );

  return (
    <PageLayout
      title={p.t('finance.expenses.title')}
      actions={<BaseButton onClick={p.openCreate}>{p.t('finance.expenses.add')}</BaseButton>}
    >
      <div className="finance-page">
        <FinanceListFilters
          t={p.t}
          from={p.filters.from}
          setFrom={p.filters.setFrom}
          to={p.filters.to}
          setTo={p.filters.setTo}
          categoryId={p.filters.categoryId}
          setCategoryId={p.filters.setCategoryId}
          categories={(p.categoriesQuery.data ?? []).filter((c) => c.active)}
          paymentMethod={p.filters.paymentMethod}
          setPaymentMethod={p.filters.setPaymentMethod}
          onReset={p.filters.resetFilters}
          showCategory
          showPaymentMethod
        />

        <FinanceBulkToolbar
          t={p.t}
          count={p.selectedDeletable.length}
          onDelete={() => p.setBulkDeleteOpen(true)}
          isPending={p.bulkDeleteMutation.isPending}
        />

        {p.expensesQuery.isError || p.accountsQuery.isError || p.categoriesQuery.isError ? (
          <ErrorBanner message={p.t('common.loadError')} />
        ) : null}

        <BaseTable
          isLoading={p.expensesQuery.isLoading}
          isEmpty={!p.expensesQuery.isLoading && p.rows.length === 0}
          emptyMessage={p.t('finance.expenses.empty')}
          colSpan={9}
          footer={(
            <TablePagination
              className="finance-pagination"
              page={p.page}
              pageSize={p.pageSize}
              total={p.expensesQuery.data?.totalElements ?? 0}
              totalPages={p.expensesQuery.data?.totalPages}
              onPageChange={p.setPage}
              onPageSizeChange={p.setPageSize}
            />
          )}
        >
          <table className="finance-table">
            <thead>
              <tr>
                <FinanceSelectHeader
                  selectAllRef={p.selection.selectAllRef}
                  checked={p.allSelectableSelected}
                  onChange={p.toggleSelectAllEditable}
                  disabled={p.selectableRows.length === 0}
                />
                <AdminTableNoIdHeaders />
                <th>{p.t('finance.common.date')}</th>
                <th>{p.t('finance.common.category')}</th>
                <th>{p.t('finance.expenses.counterparty')}</th>
                <th>{p.t('finance.common.account')}</th>
                <th>{p.t('finance.common.amount')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.rows.map((row, index) => {
                const editable = p.isEditable(row);
                const actions = [
                  {
                    label: p.t('finance.detail.view'),
                    onClick: () => setDetailRow(row),
                  },
                ];
                if (editable) {
                  actions.push(
                    { label: p.t('common.edit'), onClick: () => p.openEdit(row) },
                    { label: p.t('common.delete'), onClick: () => p.openDelete(row), danger: true },
                  );
                }

                return (
                  <tr key={row.id} className={p.selection.selectedIds.has(row.id) ? 'finance-table__row--selected' : ''}>
                    <FinanceSelectCell
                      checked={p.selection.selectedIds.has(row.id)}
                      onChange={() => p.selection.toggleSelect(row.id)}
                      disabled={!editable}
                    />
                    <AdminTableNoIdCells page={p.page} pageSize={p.pageSize} index={index} id={row.id} />
                    <td>{row.transactionDate}</td>
                    <td>{row.expenseCategoryName}</td>
                    <td>{resolveExpenseCounterpartyLabel(row, counterpartyContext)}</td>
                    <td>{row.accountName}</td>
                    <td className="finance-amount--expense">{formatMoney(row.amount, row.currency)}</td>
                    <td className="finance-cell-actions">
                      <TableRowActionsMenu
                        open={menuOpenId === row.id}
                        onOpenChange={(open) => setMenuOpenId(open ? row.id : null)}
                        actions={actions}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </BaseTable>
      </div>

      <FinanceRecordDetailModal
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        kind="expense"
        record={detailRow}
        t={p.t}
        counterpartyLabel={resolveExpenseCounterpartyLabel(detailRow, counterpartyContext)}
        canEdit={detailRow ? p.isEditable(detailRow) : false}
        onEdit={p.openEdit}
        onDelete={p.openDelete}
      />

      <BaseModal
        open={p.modalOpen}
        onClose={() => { p.setModalOpen(false); p.resetForm(); }}
        title={p.editingId ? p.t('finance.expenses.edit') : p.t('finance.expenses.add')}
        size="lg"
        className="finance-modal"
        bodyClassName="finance-modal__body"
      >
        <FinanceExpenseFormFields
          t={p.t}
          form={p.form}
          setForm={p.setForm}
          accounts={p.accountsQuery.data}
          categories={p.categoriesQuery.data}
          users={p.usersQuery.data}
          isSalaryCategory={p.isSalaryCategory}
        />
        <div className="finance-form__actions">
          <BaseButton variant="secondary" onClick={() => { p.setModalOpen(false); p.resetForm(); }}>{p.t('common.cancel')}</BaseButton>
          <BaseButton onClick={p.submit} disabled={!p.form.amount || !p.form.accountId || !p.form.expenseCategoryId || p.createMutation.isPending || p.updateMutation.isPending}>
            {p.t('common.save')}
          </BaseButton>
        </div>
      </BaseModal>

      <FinanceBulkConfirmModal
        open={p.bulkDeleteOpen || !!p.deleteTarget}
        onClose={() => { p.setBulkDeleteOpen(false); p.setDeleteTarget(null); }}
        title={p.t('finance.bulk.deleteTitle')}
        hint={p.t('finance.bulk.deleteHint', { count: deleteCount })}
        note={p.t('finance.expenses.deleteConfirm')}
        confirmLabel={p.t('finance.bulk.delete')}
        cancelLabel={p.t('common.cancel')}
        onConfirm={p.confirmDelete}
        isPending={deletePending}
      />
    </PageLayout>
  );
}
