import PosCatalogPanel from '../../cashier/components/PosCatalogPanel';
import CashierRegisterShell from '../../cashier/components/shell/CashierRegisterShell';
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

  const hallsBar = (
    <div
      className={`restaurant-cashier__halls${restaurantPane === 'tables' ? '' : ' restaurant-cashier__halls--hidden'}`}
      aria-hidden={restaurantPane !== 'tables' || undefined}
    >
      {halls.map((hall) => (
        <button
          key={hall.id}
          type="button"
          className={`restaurant-cashier__hall-tab${selectedHall?.id === hall.id ? ' is-active' : ''}`}
          onClick={() => onSelectHall(hall.id)}
          tabIndex={restaurantPane === 'tables' ? undefined : -1}
        >
          {hall.name}
        </button>
      ))}
    </div>
  );

  return (
    <CashierRegisterShell
      splitClassName={`restaurant-cashier__split restaurant-cashier__split--${paneClass}${tablesSessionOpen ? ' restaurant-cashier__split--session-open' : ''}`}
      stageClassName="restaurant-cashier__stage"
      beforeWorkspace={hallsBar}
      pay={{
        className: 'restaurant-cashier__actions-col',
        payOpen,
        total,
        onReturn,
        onDiscount,
        onConfirm: onConfirmPayment,
        onOpenPaymentFlow,
        onClosePayment,
        checkoutDisabled: payDisabled,
        isPending: checkoutPending,
        payFlowOptions,
        payFlowSession,
        payFlowKeyPrefix: 'restaurant-pay-flow',
        onPayFlowClosed,
      }}
    >
      <div className="restaurant-cashier__main-col">
        {mainContent}
      </div>
    </CashierRegisterShell>
  );
}
