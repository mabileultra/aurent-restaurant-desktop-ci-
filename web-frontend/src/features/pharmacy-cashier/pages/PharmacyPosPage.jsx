import PosOrderDiscountModal from '../../cashier/components/PosOrderDiscountModal';
import { PosReturnModal } from '../../../components/pos';
import WeightEntryModal from '../../cashier/components/WeightEntryModal';
import PharmacyQtyModal from '../components/PharmacyQtyModal';
import PharmacyRegisterWorkspace from '../components/PharmacyRegisterWorkspace';
import { usePharmacyPosPage } from '../hooks/usePharmacyPosPage';
import '../styles/pharmacy-cashier.css';

export default function PharmacyPosPage() {
  const p = usePharmacyPosPage();

  if (p.storeBlocked) {
    return (
      <div className="alert alert-warning mb-0">
        {p.noAssignment ? p.t('pos.noStoreAssigned') : p.t('pos.multipleStoresAssigned')}
      </div>
    );
  }

  if (!p.storeId) {
    return <div className="alert alert-secondary mb-0">{p.t('common.loading')}</div>;
  }

  return (
    <div className="cashier-register pharmacy-cashier pharmacy-cashier--compact d-flex flex-column flex-grow-1 min-h-0">
      <PharmacyRegisterWorkspace
        searchInputRef={p.searchInputRef}
        catalog={p.catalog}
        integration={p.integration}
        payOpen={p.payOpen}
        onClosePayment={p.handleClosePayment}
        cart={{
          items: p.items,
          total: p.total,
          selectedLineId: p.selectedLineId,
          setSelectedLineId: p.setSelectedLineId,
          handleQtyDelta: p.cartHandlers.handleQtyDelta,
          removeItem: p.removeItem,
          checkNo: p.checkNo,
          parkedCarts: p.parkedCarts,
          onNewReceipt: p.handleNewReceipt,
          onClearCart: p.handleClearCart,
          onRestoreParked: p.handleRestoreParked,
          onRemoveParked: p.handleRemoveParked,
          onClearParked: p.handleClearParked,
        }}
        checkout={{
          checkoutMutation: p.checkoutMutation,
          handleConfirmPayment: p.handleConfirmPayment,
        }}
        shiftIsOpen={p.shiftIsOpen}
        onReturn={() => p.setReturnOpen(true)}
        onDiscount={p.handleDiscount}
        onOpenPaymentFlow={p.handleOpenPaymentFlow}
        onPayFlowClosed={p.handlePayFlowClosed}
        payFlowOptions={p.payFlowOptions}
        payFlowSession={p.payFlowSession}
      />

      <PosReturnModal
        terminal
        catalogKind="pharmacy"
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

      <PharmacyQtyModal
        open={!!p.cartHandlers.qtyModalProduct}
        product={p.cartHandlers.qtyModalProduct}
        storeId={p.storeId}
        onConfirm={p.cartHandlers.handleQtyConfirm}
        onClose={p.cartHandlers.closeQtyModal}
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
