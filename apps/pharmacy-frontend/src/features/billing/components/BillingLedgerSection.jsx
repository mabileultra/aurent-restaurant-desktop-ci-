import { Trash2 } from 'lucide-react';
import TablePagination from '../../../components/shared/TablePagination';

export default function BillingLedgerSection({
  t,
  money,
  formatDateTime,
  ledgerTabs,
  ledgerType,
  setLedgerType,
  tabTone,
  ledger,
  ledgerLoading,
  ledgerPage,
  ledgerPageSize,
  ledgerTotal,
  setLedgerPage,
  setLedgerPageSize,
  pageSizeOptions,
  selectedIds,
  allPageSelected,
  selectAllRef,
  toggleSelect,
  toggleSelectAllPage,
  openDetail,
  openDeleteOne,
  openDeleteSelected,
  openDeleteAll,
  deleting,
}) {
  const selectedCount = selectedIds.size;
  const colSpan = 6;

  return (
    <div className="billing-panel">
      <div className="billing-panel__head">
        <div>
          <h3 className="billing-panel__title">{t('billing.ledgerTitle')}</h3>
          <p className="billing-panel__sub">{t('billing.ledgerSub')}</p>
        </div>
        <div className="billing-panel__actions">
          {selectedCount > 0 ? (
            <button
              type="button"
              className="billing-btn billing-btn--danger billing-btn--sm"
              disabled={deleting}
              onClick={openDeleteSelected}
            >
              {t('billing.deleteSelectedCount', { count: selectedCount })}
            </button>
          ) : null}
          <button
            type="button"
            className="billing-btn billing-btn--danger billing-btn--sm"
            disabled={deleting || ledgerTotal === 0}
            onClick={openDeleteAll}
          >
            {t('billing.deleteAll')}
          </button>
        </div>
      </div>
      <div className="billing-tabs">
        {ledgerTabs.map((tab) => (
          <button
            key={tab || 'all'}
            type="button"
            className={`billing-tab ${tabTone(tab)} ${ledgerType === tab ? `billing-tab--active ${tabTone(tab)}` : ''}`}
            onClick={() => setLedgerType(tab)}
          >
            {tab ? t(`billing.ledgerTypes.${tab}`) : t('billing.ledgerAll')}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="billing-table">
          <thead>
            <tr>
              <th className="billing-check">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  disabled={ledger.length === 0}
                  onChange={toggleSelectAllPage}
                  aria-label={t('billing.selectAll')}
                />
              </th>
              <th>{t('billing.colDate')}</th>
              <th>{t('billing.colType')}</th>
              <th>{t('billing.colDesc')}</th>
              <th>{t('billing.colAmount')}</th>
              <th className="billing-table__actions">{t('billing.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {ledgerLoading ? (
              <tr><td colSpan={colSpan}>{t('common.loading')}</td></tr>
            ) : ledger.length === 0 ? (
              <tr><td colSpan={colSpan}>{t('billing.ledgerEmpty')}</td></tr>
            ) : (
              ledger.map((row) => {
                const plus = Number(row.amount) >= 0;
                const selected = selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`billing-row--clickable${selected ? ' billing-row--selected' : ''}`}
                    onClick={() => openDetail(row)}
                  >
                    <td className="billing-check" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(row.id)}
                        aria-label={t('billing.selectRow')}
                      />
                    </td>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>
                      <span className={`billing-badge billing-badge--${row.entryType}`}>
                        {t(`billing.ledgerTypes.${row.entryType}`, { defaultValue: row.entryType })}
                      </span>
                    </td>
                    <td>{row.description || '—'}</td>
                    <td className={plus ? 'billing-amount--plus' : 'billing-amount--minus'}>
                      {plus ? '+' : ''}{money(row.amount)} {t('billing.currency')}
                    </td>
                    <td className="billing-table__actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="billing-icon-btn"
                        disabled={deleting}
                        onClick={() => openDeleteOne(row)}
                        aria-label={t('billing.deleteOne')}
                        title={t('billing.deleteOne')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={ledgerPage}
        pageSize={ledgerPageSize}
        total={ledgerTotal}
        onPageChange={setLedgerPage}
        onPageSizeChange={setLedgerPageSize}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
