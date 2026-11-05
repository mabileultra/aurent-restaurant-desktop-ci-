import TablePagination from '../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { BaseButton, BaseModal, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceAccountCreateForm from '../components/accounts/FinanceAccountCreateForm';
import FinanceAccountEditForm from '../components/accounts/FinanceAccountEditForm';
import FinanceBulkConfirmModal from '../components/shared/FinanceBulkConfirmModal';
import FinanceBulkToolbar from '../components/shared/FinanceBulkToolbar';
import FinanceRowActions from '../components/shared/FinanceRowActions';
import FinanceSelectHeader, { FinanceSelectCell } from '../components/shared/FinanceSelectHeader';
import { useClientTablePagination } from '../hooks/shared/useClientTablePagination';
import { useFinanceAccountsPage } from '../hooks/accounts/useFinanceAccountsPage';
import { formatMoney } from '../utils/shared/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/accounts.css';
import '../../../styles/finance/bulk-actions.css';

export default function FinanceAccountsPage() {
  const p = useFinanceAccountsPage();
  const pagination = useClientTablePagination(p.allRows, { initialPageSize: 14 });

  return (
    <PageLayout
      title={p.t('finance.accounts.title')}
      subtitle={p.t('finance.accounts.subtitle')}
      actions={<BaseButton onClick={() => p.setModalOpen(true)}>{p.t('finance.accounts.add')}</BaseButton>}
    >
      <div className="finance-page">
        <FinanceBulkToolbar
          t={p.t}
          count={p.selectedActive.length}
          onDisable={() => p.setBulkDisableOpen(true)}
          disableLabel={p.t('finance.bulk.deactivate')}
          isPending={p.bulkDisableMutation.isPending}
        />

        {p.query.isError ? <ErrorBanner message={p.t('common.loadError')} /> : null}

        <BaseTable
          className="finance-panel"
          isLoading={p.query.isLoading}
          isEmpty={!p.query.isLoading && p.allRows.length === 0}
          emptyMessage={p.t('finance.accounts.empty')}
          colSpan={8}
          footer={!p.query.isLoading ? (
            <TablePagination
              className="finance-pagination"
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          ) : null}
        >
          <table className="finance-table">
            <thead>
              <tr>
                <FinanceSelectHeader
                  selectAllRef={p.selection.selectAllRef}
                  checked={pagination.rows.length > 0 && pagination.rows.every((r) => p.selection.selectedIds.has(r.id))}
                  onChange={p.selection.toggleSelectAllPage}
                  disabled={pagination.rows.length === 0}
                />
                <AdminTableNoIdHeaders />
                <th>{p.t('finance.accounts.name')}</th>
                <th>{p.t('finance.accounts.type')}</th>
                <th>{p.t('finance.accounts.balance')}</th>
                <th>{p.t('finance.accounts.status')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagination.rows.map((row, index) => (
                <tr key={row.id}>
                  <FinanceSelectCell
                    checked={p.selection.selectedIds.has(row.id)}
                    onChange={() => p.selection.toggleSelect(row.id)}
                  />
                  <AdminTableNoIdCells
                    page={pagination.page}
                    pageSize={pagination.pageSize}
                    index={index}
                    id={row.id}
                  />
                  <td>{row.name}</td>
                  <td><span className="finance-account-type">{row.type}</span></td>
                  <td className="finance-table__balance">{formatMoney(row.balance, row.currency)}</td>
                  <td>
                    <span className={`finance-badge ${row.active ? 'finance-badge--success' : 'finance-badge--muted'}`}>
                      {row.active ? p.t('common.active') : p.t('common.inactive')}
                    </span>
                  </td>
                  <td className="finance-cell-actions">
                    <FinanceRowActions
                      t={p.t}
                      onEdit={() => p.openEdit(row)}
                      onToggle={() => p.toggleActive(row)}
                      isActive={row.active !== false}
                      canDelete={false}
                      canToggle
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </BaseTable>
      </div>

      <BaseModal open={p.modalOpen} onClose={() => p.setModalOpen(false)} title={p.t('finance.accounts.add')} size="lg" className="finance-modal" bodyClassName="finance-modal__body">
        <FinanceAccountCreateForm
          t={p.t}
          form={p.form}
          setForm={p.setForm}
          accountTypes={p.accountTypes}
          onCancel={() => p.setModalOpen(false)}
          onSubmit={p.submit}
          isPending={p.createMutation.isPending}
        />
      </BaseModal>

      <BaseModal open={!!p.editModal} onClose={() => p.setEditModal(null)} title={p.t('finance.accounts.edit')} size="lg" className="finance-modal" bodyClassName="finance-modal__body">
        <FinanceAccountEditForm
          t={p.t}
          form={p.editForm}
          setForm={p.setEditForm}
          accountTypes={p.accountTypes}
          onCancel={() => p.setEditModal(null)}
          onSubmit={p.submitEdit}
          isPending={p.updateMutation.isPending}
        />
      </BaseModal>

      <FinanceBulkConfirmModal
        open={p.bulkDisableOpen}
        onClose={() => p.setBulkDisableOpen(false)}
        title={p.t('finance.bulk.deactivateTitle')}
        hint={p.t('finance.bulk.deactivateHint', { count: p.selectedActive.length })}
        note={p.t('finance.accounts.deactivateNote')}
        confirmLabel={p.t('finance.bulk.deactivate')}
        cancelLabel={p.t('common.cancel')}
        onConfirm={p.confirmBulkDisable}
        isPending={p.bulkDisableMutation.isPending}
      />
    </PageLayout>
  );
}
