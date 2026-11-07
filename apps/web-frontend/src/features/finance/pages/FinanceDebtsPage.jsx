import TablePagination from '../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { BaseButton, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceDebtEntriesModal from '../components/debts/FinanceDebtEntriesModal';
import FinanceDebtPayModal from '../components/debts/FinanceDebtPayModal';
import { useClientTablePagination } from '../hooks/shared/useClientTablePagination';
import { useFinanceDebtsPage } from '../hooks/debts/useFinanceDebtsPage';
import { formatMoney } from '../utils/shared/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/debts.css';

export default function FinanceDebtsPage() {
  const p = useFinanceDebtsPage();
  const allRows = p.tab === 'customers'
    ? (p.customerDebtsQuery.data ?? [])
    : p.tab === 'advances'
      ? (p.customerAdvancesQuery.data ?? [])
      : (p.supplierDebtsQuery.data ?? []);
  const isLoading = p.tab === 'customers'
    ? p.customerDebtsQuery.isLoading
    : p.tab === 'advances'
      ? p.customerAdvancesQuery.isLoading
      : p.supplierDebtsQuery.isLoading;
  const isError = p.customerDebtsQuery.isError
    || p.supplierDebtsQuery.isError
    || p.customerAdvancesQuery.isError
    || p.accountsQuery.isError;
  const pagination = useClientTablePagination(allRows, { initialPageSize: 14, resetKey: p.tab });

  return (
    <PageLayout title={p.t('finance.debts.title')} subtitle={p.t('finance.debts.subtitle')}>
      <div className="finance-page">
        <div className="finance-tabs">
          <button
            type="button"
            className={`finance-tabs__btn ${p.tab === 'customers' ? 'finance-tabs__btn--active' : ''}`}
            onClick={() => p.setTab('customers')}
          >
            {p.t('finance.debts.customers')}
          </button>
          <button
            type="button"
            className={`finance-tabs__btn ${p.tab === 'advances' ? 'finance-tabs__btn--active' : ''}`}
            onClick={() => p.setTab('advances')}
          >
            {p.t('finance.debts.advances')}
          </button>
          <button
            type="button"
            className={`finance-tabs__btn ${p.tab === 'suppliers' ? 'finance-tabs__btn--active' : ''}`}
            onClick={() => p.setTab('suppliers')}
          >
            {p.t('finance.debts.suppliers')}
          </button>
        </div>

        {isError ? <ErrorBanner message={p.t('common.loadError')} /> : null}

        <BaseTable
          className="finance-panel"
          isLoading={isLoading}
          isEmpty={!isLoading && allRows.length === 0}
          emptyMessage={p.tab === 'advances' ? p.t('finance.debts.advancesEmpty') : p.t('finance.debts.empty')}
          colSpan={5}
          footer={pagination.total > pagination.pageSize ? (
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
                <AdminTableNoIdHeaders />
                <th>{p.t('finance.debts.name')}</th>
                <th>{p.tab === 'advances' ? p.t('finance.debts.advanceBalance') : p.t('finance.debts.balance')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagination.rows.map((row, index) => (
                <tr key={row.counterpartyId}>
                  <AdminTableNoIdCells
                    page={pagination.page}
                    pageSize={pagination.pageSize}
                    index={index}
                    id={row.counterpartyId}
                  />
                  <td className="finance-debts__name">{row.counterpartyName || '—'}</td>
                  <td className={p.tab === 'advances' ? 'finance-amount--income' : 'finance-amount--expense'}>
                    {formatMoney(row.balance)}
                  </td>
                  <td className="finance-debts__actions">
                    <BaseButton size="sm" variant="secondary" onClick={() => p.openHistory(row)}>
                      {p.t('finance.debts.viewHistory')}
                    </BaseButton>
                    <BaseButton size="sm" onClick={() => p.openPay({
                      type: p.tab === 'customers' ? 'customer' : p.tab === 'advances' ? 'advance' : 'supplier',
                      counterpartyId: row.counterpartyId,
                      counterpartyName: row.counterpartyName,
                      balance: row.balance,
                    })}
                    >
                      {p.tab === 'advances' ? p.t('finance.debts.applyAdvance') : p.t('finance.debts.pay')}
                    </BaseButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </BaseTable>
      </div>

      <FinanceDebtPayModal
        payModal={p.payModal}
        onClose={() => p.setPayModal(null)}
        form={p.form}
        setForm={p.setForm}
        applyForm={p.applyForm}
        setApplyForm={p.setApplyForm}
        accounts={p.accountsQuery.data ?? []}
        onSubmit={p.submitPay}
        isPending={p.payPending}
        t={p.t}
      />

      <FinanceDebtEntriesModal
        open={Boolean(p.historyModal)}
        onClose={() => p.setHistoryModal(null)}
        type={p.historyModal?.type}
        counterpartyId={p.historyModal?.counterpartyId}
        counterpartyName={p.historyModal?.counterpartyName}
        t={p.t}
      />
    </PageLayout>
  );
}
