import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import { BaseModal, BaseTable } from '../../../../components/ui';
import { financeApi } from '../../../../api';
import { useTenantScope } from '../../../../hooks/useTenantScope';
import { formatMoney } from '../../utils/shared/formatMoney';
import { debtEntryTypeLabel } from '../../utils/debts/debtEntryLabels';
import FinanceDebtEntryDetailModal from './FinanceDebtEntryDetailModal';

export default function FinanceDebtEntriesModal({ open, onClose, type, counterpartyId, counterpartyName, t }) {
  const { tenantKey, tenantReady } = useTenantScope();
  const [detailEntry, setDetailEntry] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const query = useQuery({
    queryKey: tenantKey('finance-debt-entries', type, counterpartyId),
    queryFn: () => {
      if (type === 'advance') {
        return financeApi.debts.advances.entries(counterpartyId).then((r) => r.data);
      }
      if (type === 'customer') {
        return financeApi.debts.customers.entries(counterpartyId).then((r) => r.data);
      }
      return financeApi.debts.suppliers.entries(counterpartyId).then((r) => r.data);
    },
    enabled: tenantReady && open && Boolean(counterpartyId),
  });

  const rows = query.data ?? [];

  const handleClose = () => {
    setDetailEntry(null);
    setMenuOpenId(null);
    onClose();
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleClose}
        title={t('finance.debts.historyTitle', { name: counterpartyName ?? '' })}
        size="lg"
        className="finance-modal finance-modal--wide"
        bodyClassName="finance-modal__body"
      >
        <p className="finance-debt-detail__hint finance-debt-detail__hint--top">
          {t('finance.debts.historyHint')}
        </p>
        <BaseTable
          isLoading={query.isLoading}
          isEmpty={!query.isLoading && rows.length === 0}
          emptyMessage={t('finance.debts.historyEmpty')}
          colSpan={5}
        >
          <table className="finance-table">
            <thead>
              <tr>
                <th>{t('finance.common.date')}</th>
                <th>{t('finance.debts.historyType')}</th>
                <th>{t('finance.common.amount')}</th>
                <th>{t('finance.common.comment')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.transactionDate}</td>
                  <td>{debtEntryTypeLabel(t, row.entryType)}</td>
                  <td className={row.entryType === 'PAYMENT' ? 'finance-amount--income' : 'finance-amount--expense'}>
                    {formatMoney(row.amount)}
                  </td>
                  <td>{row.comment || '—'}</td>
                  <td className="finance-cell-actions">
                    <TableRowActionsMenu
                      open={menuOpenId === row.id}
                      onOpenChange={(isOpen) => setMenuOpenId(isOpen ? row.id : null)}
                      actions={[
                        {
                          label: t('finance.debts.viewDetail'),
                          onClick: () => setDetailEntry(row),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </BaseTable>
      </BaseModal>

      <FinanceDebtEntryDetailModal
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        entry={detailEntry}
        t={t}
      />
    </>
  );
}
