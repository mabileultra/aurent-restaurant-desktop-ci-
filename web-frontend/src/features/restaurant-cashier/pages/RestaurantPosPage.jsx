import PosOrderDiscountModal from '../../cashier/components/PosOrderDiscountModal';
import WeightEntryModal from '../../cashier/components/WeightEntryModal';
import RestaurantOpenTableModal from '../components/RestaurantOpenTableModal';
import RestaurantRegisterWorkspace from '../components/RestaurantRegisterWorkspace';
import { useRestaurantPosPage } from '../hooks/useRestaurantPosPage';
import '../styles/restaurant-cashier.css';

export default function RestaurantPosPage() {
  const p = useRestaurantPosPage();

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
    <div className="cashier-register restaurant-cashier d-flex flex-column flex-grow-1 min-h-0">
      <RestaurantRegisterWorkspace
        restaurantPane={p.restaurantPane}
        halls={p.halls}
        selectedHall={p.selectedHall}
        onSelectHall={p.setSelectedHallId}
        onTableClick={p.handleTableClick}
        session={p.session}
        sessionLoading={p.sessionLoading || p.addLinePending}
        checkOpen={p.checkOpen}
        activeTableId={p.activeTableId}
        onCloseCheck={p.handleCloseCheck}
        orderDiscount={p.orderDiscount}
        payableTotal={p.total}
        selectedLineId={p.selectedLineId}
        onSelectLine={p.setSelectedLineId}
        onQtyDelta={p.handleQtyDelta}
        onUpdateQuantity={p.handleUpdateQuantity}
        onRemoveLine={(lineId) => p.removeLineMutation.mutate(lineId)}
        onSendToKitchen={p.handleSendToKitchen}
        sendToKitchenPending={p.sendToKitchenMutation.isPending}
        sendingDepartment={p.sendingKitchenDepartment}
        kitchenDepartments={p.kitchenDepartments}
        onDiscount={() => p.setDiscountOpen(true)}
        onReturn={p.handleReturn}
        payDisabled={p.payDisabled}
        searchInputRef={p.searchInputRef}
        catalog={p.catalogProps}
        payOpen={p.payOpen}
        onClosePayment={p.handleClosePayment}
        onPayFlowClosed={p.handlePayFlowClosed}
        onOpenPaymentFlow={p.handleOpenPaymentFlow}
        total={p.total}
        onConfirmPayment={p.handleConfirmPayment}
        checkoutPending={p.checkoutMutation.isPending}
        payFlowOptions={p.payFlowOptions}
        payFlowSession={p.payFlowSession}
        t={p.t}
      />

      <RestaurantOpenTableModal
        open={p.openTableModal}
        table={p.selectedTable}
        onClose={() => p.setOpenTableModal(false)}
        onConfirm={p.handleOpenTable}
        isPending={p.openSessionMutation.isPending}
        t={p.t}
      />

      <PosOrderDiscountModal
        terminal
        open={p.discountOpen}
        onClose={() => p.setDiscountOpen(false)}
        linesTotal={p.linesTotal}
        orderDiscount={p.orderDiscount}
        onApplyAmount={p.handleApplyOrderDiscountAmount}
        onApplyPercent={p.handleApplyOrderDiscountPercent}
        onClear={p.clearOrderDiscount}
      />

      <WeightEntryModal
        open={!!p.weightModalProduct}
        product={p.weightModalProduct}
        unitPrice={p.weightModalProduct?.sellingPrice}
        maxStock={p.weightModalProduct?.stockQuantity}
        onConfirm={p.handleWeightConfirm}
        onClose={() => p.setWeightModalProduct(null)}
      />
    </div>
  );
}
