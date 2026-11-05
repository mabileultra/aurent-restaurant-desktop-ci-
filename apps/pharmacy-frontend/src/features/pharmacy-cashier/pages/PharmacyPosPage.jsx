import { PosReturnModal } from '../../../components/pos';
import ShiftCashMovementModal from '../../cashier/components/ShiftCashMovementModal';
import PharmacyOrderDiscountModal from '../components/PharmacyOrderDiscountModal';
import PharmacyPosSettingsModal from '../components/PharmacyPosSettingsModal';
import PharmacyChecksModal from '../components/PharmacyChecksModal';
import PharmacyCashOpsModal from '../components/PharmacyCashOpsModal';
import PharmacyBranchSearchModal from '../components/PharmacyBranchSearchModal';
import PharmacyParkedModal from '../components/PharmacyParkedModal';
import PharmacyQtyModal from '../components/PharmacyQtyModal';
import PharmacyWeightEntryModal from '../components/PharmacyWeightEntryModal';
import PharmacyRegisterWorkspace from '../components/PharmacyRegisterWorkspace';
import { usePharmacyPosPage } from '../hooks/usePharmacyPosPage';
import { usePharmacyPosChrome } from '../hooks/usePharmacyPosChrome';
import { usePharmacyPosActions } from '../../../pharmacy/pos/pharmacyPosActions';
import { useCashierCashMovement } from '../../cashier/hooks/useCashierCashMovement';
import { updatePharmacyCartLinePrice } from '../utils/pharmacyCartActions';
import '../styles/pharmacy-cashier.css';
import '../styles/pharmacy-modal-shell.css';
import '../styles/pharmacy-return-modal.css';
import '../styles/pharmacy-cash-move-modal.css';

export default function PharmacyPosPage() {
  const p = usePharmacyPosPage();
  const actions = usePharmacyPosActions();
  const chrome = usePharmacyPosChrome({
    setReturnOpen: p.setReturnOpen,
  });
  const cashMovement = useCashierCashMovement({
    shiftIsOpen: p.shiftIsOpen,
    storeId: p.storeId,
    t: p.t,
  });

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
        kmInputRef={p.kmInputRef}
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
          onUpdatePrice: updatePharmacyCartLinePrice,
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
        onHold={p.handleNewReceipt}
        onCashIn={cashMovement.handleCashIn}
        onCashOut={cashMovement.handleCashOut}
        onOpenPaymentFlow={p.handleOpenPaymentFlow}
        onPayFlowClosed={p.handlePayFlowClosed}
        payFlowOptions={p.payFlowOptions}
        payFlowSession={p.payFlowSession}
        markingNotice={p.markingNotice}
        clearMarkingNotice={p.clearMarkingNotice}
        onRefreshCatalog={p.refreshCatalog}
      />

      <PharmacyChecksModal
        open={chrome.checksOpen}
        onClose={() => chrome.setChecksOpen(false)}
      />

      <PharmacyCashOpsModal
        open={chrome.cashOpen}
        onClose={() => chrome.setCashOpen(false)}
        onPick={(id) => {
          chrome.setCashOpen(false);
          actions?.runPay(id);
        }}
      />

      <PharmacyBranchSearchModal
        open={chrome.branchOpen}
        onClose={() => chrome.setBranchOpen(false)}
      />

      <PharmacyParkedModal
        open={chrome.parkedOpen}
        onClose={() => chrome.setParkedOpen(false)}
        parkedCarts={p.parkedCarts}
        onPark={p.handleNewReceipt}
        onRestore={p.handleRestoreParked}
        onRemove={p.handleRemoveParked}
        onClear={p.handleClearParked}
      />

      <PharmacyPosSettingsModal
        open={chrome.settingsOpen}
        onClose={() => chrome.setSettingsOpen(false)}
      />

      <ShiftCashMovementModal
        variant="pharmacy"
        open={Boolean(cashMovement.cashMovement)}
        direction={cashMovement.cashMovement || 'IN'}
        shiftId={p.shift?.id}
        onClose={() => cashMovement.setCashMovement(null)}
        onSuccess={cashMovement.handleCashMovementSuccess}
      />

      <PosReturnModal
        variant="pharmacy"
        terminal
        catalogKind="pharmacy"
        cashRegisterId={p.shift?.cashRegisterId ?? null}
        open={p.returnOpen}
        onClose={() => p.setReturnOpen(false)}
        onSuccess={p.handleReturnSuccess}
      />

      <PharmacyOrderDiscountModal
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

      <PharmacyWeightEntryModal
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
