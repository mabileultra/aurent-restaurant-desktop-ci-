import CashierRecentSales from './CashierRecentSales';
import CashierPaidReceiptPane from './CashierPaidReceiptPane';
import '../styles/cashier-paid-receipts.css';

/**
 * Paid receipts master-detail — list + receipt pane (like grocery my-sales).
 */
export default function CashierPaidReceiptsWorkspace({
  rows,
  loading,
  selectedId,
  onSelectRow,
  onClearSelection,
  storeName,
  waiterNameById,
  returnDisabled,
  onReturn,
  emptyText,
  t,
}) {
  return (
    <div className={`rst-paid-receipts${selectedId ? ' has-selection' : ''}`}>
      <div className="rst-paid-receipts__list">
        <CashierRecentSales
          rows={rows}
          loading={loading}
          selectedId={selectedId}
          onOpenReceipt={onSelectRow}
          emptyText={emptyText}
          t={t}
        />
      </div>
      {selectedId ? (
        <CashierPaidReceiptPane
          orderId={selectedId}
          storeName={storeName}
          waiterNameById={waiterNameById}
          returnDisabled={returnDisabled}
          onReturn={onReturn}
          onClose={onClearSelection}
          allowRefund
          t={t}
        />
      ) : null}
    </div>
  );
}
