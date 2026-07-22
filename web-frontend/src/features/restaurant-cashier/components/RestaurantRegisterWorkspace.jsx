import PosCatalogPanel from '../../cashier/components/PosCatalogPanel';
import PosPaymentFlow from '../../cashier/components/PosPaymentFlow';
import PosRegisterPayRail from '../../cashier/components/register-pay-rail/PosRegisterPayRail';
import { usePayFlowTransition } from '../../cashier/hooks/usePayFlowTransition';
import CashierBottomNav from '../../../components/layout/cashier/bottom-nav/CashierBottomNav';
import RestaurantFloorPlan from './RestaurantFloorPlan';
import RestaurantOrderPanel from './RestaurantOrderPanel';

export default function RestaurantRegisterWorkspace({
  restaurantPane,
  halls,
  selectedHall,
  onSelectHall,
  onTableClick,
  session,
  sessionLoading,
  checkOpen,
  activeTableId,
  onCloseCheck,
  orderDiscount,
  payableTotal,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onUpdateQuantity,
  onRemoveLine,
  onSendToKitchen,
  sendToKitchenPending,
  sendingDepartment,
  kitchenDepartments,
  onDiscount,
  onReturn,
  searchInputRef,
  catalog,
  payOpen,
  onClosePayment,
  onOpenPaymentFlow,
  onPayFlowClosed,
  total,
  onConfirmPayment,
  checkoutPending,
  payDisabled,
  payFlowOptions,
  payFlowSession,
  t,
}) {
  const paneClass = restaurantPane === 'catalog' ? 'catalog' : 'tables';
  const tablesSessionOpen = restaurantPane === 'tables' && checkOpen;
  const showPayRail = restaurantPane === 'tables';

  usePayFlowTransition(payOpen, onPayFlowClosed);

  let mainContent = null;
  if (restaurantPane === 'catalog') {
    mainContent = (
      <PosCatalogPanel
        ref={searchInputRef}
        search={catalog.search}
        onSearchChange={catalog.setSearch}
        onSearchEnter={catalog.handleSearchEnter}
        scanDisabled={!session}
        categories={catalog.categories}
        categoriesLoading={catalog.categoriesLoading}
        categoriesError={catalog.categoriesError}
        selectedCategoryId={catalog.selectedCategoryId}
        onSelectCategory={catalog.handleSelectCategory}
        searchActive={catalog.searchActive}
        catalogBrowse={catalog.catalogBrowse}
        onBrowseChange={catalog.setCatalogBrowse}
        products={catalog.products}
        productsLoading={catalog.productsLoading}
        productsError={catalog.productsError}
        productsLoadingMore={catalog.productsLoadingMore}
        productsHasMore={catalog.productsHasMore}
        onLoadMoreProducts={catalog.fetchMoreProducts}
        onAddProduct={catalog.addProductToCart}
        viewMode={catalog.viewMode}
        onViewModeChange={catalog.handleViewModeChange}
      />
    );
  } else if (tablesSessionOpen) {
    mainContent = (
      <RestaurantOrderPanel
        session={session}
        loading={sessionLoading}
        payableTotal={payableTotal}
        orderDiscount={orderDiscount}
        selectedLineId={selectedLineId}
        onSelectLine={onSelectLine}
        onQtyDelta={onQtyDelta}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemoveLine}
        onSendToKitchen={onSendToKitchen}
        sendToKitchenPending={sendToKitchenPending}
        sendingDepartment={sendingDepartment}
        kitchenDepartments={kitchenDepartments}
        onClose={onCloseCheck}
        t={t}
      />
    );
  } else {
    mainContent = (
      <RestaurantFloorPlan
        hall={selectedHall}
        onTableClick={onTableClick}
        selectedTableId={activeTableId}
        t={t}
      />
    );
  }

  return (
    <div
      className={`cashier-register__split cashier-register__split--pane restaurant-cashier__split restaurant-cashier__split--${paneClass}${tablesSessionOpen ? ' restaurant-cashier__split--session-open' : ''}`}
    >
      {restaurantPane === 'tables' ? (
        <div className="restaurant-cashier__halls">
          {halls.map((hall) => (
            <button
              key={hall.id}
              type="button"
              className={`restaurant-cashier__hall-tab${selectedHall?.id === hall.id ? ' is-active' : ''}`}
              onClick={() => onSelectHall(hall.id)}
            >
              {hall.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="cashier-register__workspace">
        <div className="cashier-register__stage restaurant-cashier__stage">
          <div className="restaurant-cashier__main-col">
            {mainContent}
          </div>

          <aside
            className={`cashier-register__actions-col restaurant-cashier__actions-col${payOpen ? ' cashier-register__actions-col--pay' : ''}${showPayRail ? '' : ' restaurant-cashier__actions-col--collapsed'}`}
            inert={!showPayRail || undefined}
          >
            <div className="cashier-register__pay-shell">
              <div
                className="cashier-register__pay-pane cashier-register__pay-pane--rail"
                inert={payOpen || undefined}
              >
                <PosRegisterPayRail
                  total={total}
                  onReturn={onReturn}
                  onDiscount={onDiscount}
                  onConfirm={onConfirmPayment}
                  onOpenPaymentFlow={onOpenPaymentFlow}
                  checkoutDisabled={payDisabled}
                  isPending={checkoutPending}
                />
              </div>

              {payOpen ? (
                <div className="cashier-register__pay-pane cashier-register__pay-pane--flow">
                  <PosPaymentFlow
                    key={`restaurant-pay-flow-${payFlowSession}`}
                    onClose={onClosePayment}
                    total={total}
                    isPending={checkoutPending}
                    onConfirm={onConfirmPayment}
                    openOptions={payFlowOptions}
                  />
                </div>
              ) : null}
            </div>
          </aside>

          <CashierBottomNav className="cashier-register__bottom-nav" />
        </div>
      </div>
    </div>
  );
}
