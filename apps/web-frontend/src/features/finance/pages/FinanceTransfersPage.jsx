import { useState } from 'react';
import TablePagination from '../../../components/shared/TablePagination';
import TableRowActionsMenu from '../../../components/shared/TableRowActionsMenu';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { BaseButton, BaseInput, BaseModal, BaseSelect, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceListFilters from '../components/shared/FinanceListFilters';
import FinanceRecordDetailModal from '../components/shared/FinanceRecordDetailModal';
import { useFinanceTransfersPage } from '../hooks/transfers/useFinanceTransfersPage';
import { formatMoney } from '../utils/shared/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/detail-modal.css';

export default function FinanceTransfersPage() {
  const p = useFinanceTransfersPage();
  const rows = p.transfersQuery.data?.content ?? [];
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);

  return (
    <PageLayout
      title={p.t('finance.transfers.title')}
      subtitle={p.t('finance.transfers.subtitle')}
      actions={<BaseButton onClick={() => p.setModalOpen(true)}>{p.t('finance.transfers.add')}</BaseButton>}
    >
      <div className="finance-page">
        <FinanceListFilters
          t={p.t}
          from={p.filters.from}
          setFrom={p.filters.setFrom}
          to={p.filters.to}
          setTo={p.filters.setTo}
          onReset={p.filters.resetFilters}
        />

        {p.transfersQuery.isError || p.accountsQuery.isError ? (
          <ErrorBanner message={p.t('common.loadError')} />
        ) : null}

        <BaseTable
          isLoading={p.transfersQuery.isLoading}
          isEmpty={!p.transfersQuery.isLoading && rows.length === 0}
          emptyMessage={p.t('finance.transfers.empty')}
          colSpan={8}
          footer={(
            <TablePagination
              className="finance-pagination"
              page={p.page}
              pageSize={p.pageSize}
              total={p.transfersQuery.data?.totalElements ?? 0}
              totalPages={p.transfersQuery.data?.totalPages}
              onPageChange={p.setPage}
              onPageSizeChange={p.setPageSize}
            />
          )}
        >
          <table className="finance-table">
            <thead>
              <tr>
                <AdminTableNoIdHeaders />
                <th>{p.t('finance.transfers.date')}</th>
                <th>{p.t('finance.transfers.from')}</th>
                <th>{p.t('finance.transfers.to')}</th>
                <th>{p.t('finance.common.amount')}</th>
                <th>{p.t('finance.common.comment')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <AdminTableNoIdCells page={p.page} pageSize={p.pageSize} index={index} id={row.id} />
                  <td>{row.transactionDate}</td>
                  <td>{row.fromAccountName}</td>
                  <td>{row.toAccountName}</td>
                  <td className="finance-amount--income">{formatMoney(row.amount, row.currency)}</td>
                  <td>{row.comment || '—'}</td>
                  <td className="finance-cell-actions">
                    <TableRowActionsMenu
                      open={menuOpenId === row.id}
                      onOpenChange={(open) => setMenuOpenId(open ? row.id : null)}
                      actions={[
                        {
                          label: p.t('finance.detail.view'),
                          onClick: () => setDetailRow(row),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </BaseTable>
      </div>

      <FinanceRecordDetailModal
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        kind="transfer"
        record={detailRow}
        t={p.t}
      />

      <BaseModal
        open={p.modalOpen}
        onClose={() => p.setModalOpen(false)}
        title={p.t('finance.transfers.add')}
        size="lg"
        className="finance-modal"
        bodyClassName="finance-modal__body"
      >
        <div className="finance-form">
          <BaseSelect
            label={p.t('finance.transfers.from')}
            value={p.form.fromAccountId}
            onChange={(e) => p.setForm({ ...p.form, fromAccountId: e.target.value })}
            placeholder={p.t('common.select')}
            options={[
              { value: '', label: p.t('common.select') },
              ...p.accounts.map((a) => ({
                value: String(a.id),
                label: `${a.name} (${formatMoney(a.balance, a.currency)})`,
              })),
            ]}
          />
          <BaseSelect
            label={p.t('finance.transfers.to')}
            value={p.form.toAccountId}
            onChange={(e) => p.setForm({ ...p.form, toAccountId: e.target.value })}
            placeholder={p.t('common.select')}
            options={[
              { value: '', label: p.t('common.select') },
              ...p.accounts.map((a) => ({ value: String(a.id), label: a.name })),
            ]}
          />
          <BaseInput
            label={p.t('finance.common.amount')}
            type="number"
            value={p.form.amount}
            onChange={(e) => p.setForm({ ...p.form, amount: e.target.value })}
          />
          <BaseInput
            label={p.t('finance.common.comment')}
            value={p.form.comment}
            onChange={(e) => p.setForm({ ...p.form, comment: e.target.value })}
          />
          <div className="finance-form__actions">
            <BaseButton variant="secondary" onClick={() => p.setModalOpen(false)}>{p.t('common.cancel')}</BaseButton>
            <BaseButton
              onClick={p.submit}
              disabled={
                !p.form.fromAccountId
                || !p.form.toAccountId
                || !p.form.amount
                || p.form.fromAccountId === p.form.toAccountId
                || p.createMutation.isPending
              }
            >
              {p.t('finance.transfers.confirm')}
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </PageLayout>
  );
}
