import CashierSalesListCard from './CashierSalesListCard';
import CashierSalesReceiptPane from './CashierSalesReceiptPane';

export default function CashierMySalesWorkspace({
  t,
  catalogKind,
  shiftLoading,
  shiftId,
  rows,
  salesLoading,
  filtering,
  page,
  sales,
  onPageChange,
  selectedId,
  viewMode,
  onViewModeChange,
  onRowClick,
  selectedRow,
  returnSaleId,
  onReturn,
  onCloseReceipt,
}) {
  if (shiftLoading) {
    return <p className="text-muted small">{t('common.loading')}</p>;
  }

  if (!shiftId) {
    return <div className="alert alert-warning mb-0">{t('pos.shiftRequired')}</div>;
  }

  return (
    <div className={`cashier-sales-master${selectedId ? ' has-selection' : ''}`}>
      <div className="cashier-sales-list-pane">
        <CashierSalesListCard
          rows={rows}
          isPending={salesLoading || filtering}
          page={page}
          totalPages={sales?.totalPages ?? 0}
          totalElements={sales?.totalElements ?? 0}
          onPageChange={onPageChange}
          selectedId={selectedId}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onRowClick={onRowClick}
          t={t}
        />
      </div>
      {selectedId ? (
        <CashierSalesReceiptPane
          catalogKind={catalogKind}
          receiptNumber={selectedRow?.receiptNumber}
          selectedRow={selectedRow}
          returnDisabled={!!returnSaleId}
          onReturn={onReturn}
          onClose={onCloseReceipt}
          t={t}
        />
      ) : null}
    </div>
  );
}
