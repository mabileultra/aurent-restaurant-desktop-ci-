import PosOrderDiscountModal from '../components/PosOrderDiscountModal';
import { PosReturnModal } from '../../../components/pos';
import WeightEntryModal from '../components/WeightEntryModal';
import PosRegisterWorkspace from '../components/pos/PosRegisterWorkspace';
import { usePosPage } from '../hooks/usePosPage';

export default function PosPage() {
  const p = usePosPage();

  return (
    <div className="cashier-register d-flex flex-column flex-grow-1 min-h-0">
      {p.storeBlocked ? (
        <div className="alert alert-warning mb-0">
          {p.noAssignment ? p.t('pos.noStoreAssigned') : p.t('pos.multipleStoresAssigned')}
        </div>
      ) : !p.storeId ? (
        <div className="alert alert-secondary mb-0">{p.t('common.loading')}</div>
      ) : (
        <>
          <PosRegisterWorkspace
            posPane={p.posPane}
            searchInputRef={p.searchInputRef}
            catalog={p.catalogProps}
            payOpen={p.payOpen}
            onClosePayment={p.handleClosePayment}
            cart={{
              items: p.items,
              total: p.total,
              selectedLineId: p.selectedLineId,
              setSelectedLineId: p.setSelectedLineId,
              handleQtyDelta: p.cartHandlers.handleQtyDelta,
              updateQuantity: p.updateQuantity,
              updateUnitPrice: p.updateUnitPrice,
              removeItem: p.removeItem,
              onHold: p.handleHoldCart,
              onClear: p.handleClearCart,
              hasParkedCart: p.hasParkedCart,
              parkedCarts: p.parkedCarts,
              onRestoreParked: p.handleRestoreParked,
              onRemoveParked: p.handleRemoveParked,
              onClearParked: p.handleClearParked,
              checkNo: p.checkNo,
              customerId: p.customerId,
              customerName: p.customerName,
              onSetCustomer: p.handleSetCustomer,
            }}
            checkout={{ checkoutMutation: p.checkoutMutation, handleConfirmPayment: p.handleConfirmPayment }}
            shiftIsOpen={p.shiftIsOpen}
            onReturn={() => p.setReturnOpen(true)}
            onDiscount={p.handleDiscount}
            onOpenPaymentFlow={p.handleOpenPaymentFlow}
            onPayFlowClosed={p.handlePayFlowClosed}
            payFlowOptions={p.payFlowOptions}
            payFlowSession={p.payFlowSession}
          />
        </>
      )}

      <PosReturnModal
        terminal
        open={p.returnOpen}
        onClose={() => p.setReturnOpen(false)}
        onSuccess={p.handleReturnSuccess}
      />

      <PosOrderDiscountModal
        terminal
        open={p.discountOpen}
        onClose={() => p.setDiscountOpen(false)}
        linesTotal={p.linesTotal}
        orderDiscount={p.orderDiscount}
        onApplyAmount={p.setOrderDiscountAmount}
        onApplyPercent={p.setOrderDiscountPercent}
        onClear={p.clearOrderDiscount}
      />

      <WeightEntryModal
        open={!!p.cartHandlers.weightModalProduct}
        product={p.cartHandlers.weightModalProduct}
        unitPrice={p.cartHandlers.weightModalProduct?.sellingPrice}
        maxStock={p.cartHandlers.weightModalProduct?.stockQuantity}
        onConfirm={p.cartHandlers.handleWeightConfirm}
        onClose={p.cartHandlers.closeWeightModal}
      />
    </div>
  );
}
