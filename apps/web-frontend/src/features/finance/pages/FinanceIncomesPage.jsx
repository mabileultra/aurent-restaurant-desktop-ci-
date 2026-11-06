import { useState } from 'react';
import TablePagination from '../../../components/shared/TablePagination';
import TableRowActionsMenu from '../../../components/shared/TableRowActionsMenu';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { BaseButton, BaseModal, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceDailyRevenueTable from '../components/incomes/FinanceDailyRevenueTable';
import FinanceIncomeFormFields from '../components/incomes/FinanceIncomeFormFields';
import FinanceIncomeViewTabs from '../components/incomes/FinanceIncomeViewTabs';
import FinanceBulkConfirmModal from '../components/shared/FinanceBulkConfirmModal';
import FinanceBulkToolbar from '../components/shared/FinanceBulkToolbar';
import FinanceListFilters from '../components/shared/FinanceListFilters';
import FinanceRecordDetailModal from '../components/shared/FinanceRecordDetailModal';
import FinanceSelectHeader, { FinanceSelectCell } from '../components/shared/FinanceSelectHeader';
import { useFinanceIncomesPage } from '../hooks/incomes/useFinanceIncomesPage';
import { formatMoney } from '../utils/shared/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/bulk-actions.css';
import '../../../styles/finance/detail-modal.css';
import '../../../styles/finance/incomes.css';

export default function FinanceIncomesPage() {
  const p = useFinanceIncomesPage();
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const deleteCount = p.bulkDeleteOpen ? p.selectedDeletable.length : (p.deleteTarget ? 1 : 0);
  const isRevenueView = p.viewTab === 'revenue';

  return (
    <PageLayout
      title={p.t('finance.incomes.title')}
      actions={<BaseButton onClick={() => { p.resetForm(); p.setModalOpen(true); }}>{p.t('finance.incomes.add')}</BaseButton>}
    >
      <div className="finance-page">
        <FinanceIncomeViewTabs t={p.t} value={p.viewTab} onChange={p.setViewTab} />

        <FinanceListFilters
          t={p.t}
          from={p.filters.from}
          setFrom={p.filters.setFrom}
          to={p.filters.to}
          setTo={p.filters.setTo}
          paymentMethod={p.filters.paymentMethod}
          setPaymentMethod={p.filters.setPaymentMethod}
          onReset={p.filters.resetFilters}
          showPaymentMethod={!isRevenueView}
        />

        {!isRevenueView ? (
          <FinanceBulkToolbar
            t={p.t}
            count={p.selectedDeletable.length}
            onDelete={() => p.setBulkDeleteOpen(true)}
            isPending={p.bulkDeleteMutation.isPending}
          />
        ) : null}

        {p.incomesQuery.isError || p.revenueQuery.isError || p.accountsQuery.isError || p.categoriesQuery.isError ? (
          <ErrorBanner message={p.t('common.loadError')} />
        ) : null}

        {isRevenueView ? (
          <FinanceDailyRevenueTable
            t={p.t}
            rows={p.revenueRows}
            isLoading={p.revenueQuery.isLoading}
            isError={p.revenueQuery.isError}
          />
        ) : (
          <BaseTable
            isLoading={p.incomesQuery.isLoading}
            isEmpty={!p.incomesQuery.isLoading && p.rows.length === 0}
            emptyMessage={p.t('finance.incomes.empty')}
            colSpan={8}
            footer={(
              <TablePagination
                className="finance-pagination"
                page={p.page}
                pageSize={p.pageSize}
                total={p.incomesQuery.data?.totalElements ?? 0}
                totalPages={p.incomesQuery.data?.totalPages}
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
                    <tr key={row.id}>
                      <FinanceSelectCell
                        checked={p.selection.selectedIds.has(row.id)}
                        onChange={() => p.selection.toggleSelect(row.id)}
                        disabled={!editable}
                      />
                      <AdminTableNoIdCells page={p.page} pageSize={p.pageSize} index={index} id={row.id} />
                      <td>{row.transactionDate}</td>
                      <td>{row.incomeCategoryName}</td>
                      <td>{row.accountName}</td>
                      <td className="finance-amount--income">{formatMoney(row.amount, row.currency)}</td>
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
        )}
      </div>

      <FinanceRecordDetailModal
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        kind="income"
        record={detailRow}
        t={p.t}
        canEdit={detailRow ? p.isEditable(detailRow) : false}
        onEdit={p.openEdit}
        onDelete={p.openDelete}
      />

      <BaseModal
        open={p.modalOpen}
        onClose={() => { p.setModalOpen(false); p.resetForm(); }}
        title={p.editingId ? p.t('finance.incomes.edit') : p.t('finance.incomes.add')}
        size="lg"
        className="finance-modal"
        bodyClassName="finance-modal__body"
      >
        <FinanceIncomeFormFields
          t={p.t}
          form={p.form}
          setForm={p.setForm}
          accounts={p.accountsQuery.data}
          categories={p.categoriesQuery.data}
        />
        <div className="finance-form__actions finance-form__actions--modal">
          <BaseButton variant="secondary" onClick={() => { p.setModalOpen(false); p.resetForm(); }}>{p.t('common.cancel')}</BaseButton>
          <BaseButton onClick={p.submit} disabled={!p.form.amount || !p.form.accountId || !p.form.incomeCategoryId}>{p.t('common.save')}</BaseButton>
        </div>
      </BaseModal>

      <FinanceBulkConfirmModal
        open={p.bulkDeleteOpen || !!p.deleteTarget}
        onClose={() => { p.setBulkDeleteOpen(false); p.setDeleteTarget(null); }}
        title={p.t('finance.bulk.deleteTitle')}
        hint={p.t('finance.bulk.deleteHint', { count: deleteCount })}
        note={p.t('finance.incomes.deleteConfirm')}
        confirmLabel={p.t('finance.bulk.delete')}
        cancelLabel={p.t('common.cancel')}
        onConfirm={p.confirmDelete}
        isPending={p.bulkDeleteMutation.isPending}
      />
    </PageLayout>
  );
}
