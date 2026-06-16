import PosCatalogPanel from '../PosCatalogPanel';
import PosOrderPanel from '../PosOrderPanel';
import PosPaymentFlow from '../PosPaymentFlow';
import PosRegisterPayRail from '../register-pay-rail/PosRegisterPayRail';
import { usePayFlowTransition } from '../../hooks/usePayFlowTransition';
import CashierBottomNav from '../../../../components/layout/cashier/bottom-nav/CashierBottomNav';

export default function PosRegisterWorkspace({
  posPane,
  searchInputRef,
  catalog,
  payOpen,
  onClosePayment,
  cart,
  checkout,
  shiftIsOpen,
  onReturn,
  onDiscount,
  onOpenPaymentFlow,
  payFlowOptions,
  payFlowSession,
  onPayFlowClosed,
}) {
  const {
    storeId,
    search,
    setSearch,
    handleSearchEnter,
    categories,
    categoriesLoading,
    categoriesError,
    selectedCategoryId,
    handleSelectCategory,
    searchActive,
    catalogBrowse,
    setCatalogBrowse,
    products,
    productsLoading,
    productsError,
    productsLoadingMore,
    productsHasMore,
    fetchMoreProducts,
    addProductToCart,
    viewMode,
    handleViewModeChange,
  } = catalog;

  const {
    items,
    total,
    selectedLineId,
    setSelectedLineId,
    handleQtyDelta,
    updateQuantity,
    updateUnitPrice,
    removeItem,
  } = cart;

  const { checkoutMutation, handleConfirmPayment } = checkout;
  usePayFlowTransition(payOpen, onPayFlowClosed);

  const payShellClassName = 'cashier-register__pay-shell';

  return (
    <div
      className={`cashier-register__split cashier-register__split--pane cashier-register__split--${posPane}`}
    >
      <div className="cashier-register__workspace">
        <div className="cashier-register__stage">
          <div className="cashier-register__catalog-col">
            <PosCatalogPanel
              ref={searchInputRef}
              search={search}
              onSearchChange={setSearch}
              onSearchEnter={handleSearchEnter}
              scanDisabled={!storeId}
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              searchActive={searchActive}
              catalogBrowse={catalogBrowse}
              onBrowseChange={setCatalogBrowse}
              products={products}
              productsLoading={productsLoading}
              productsError={productsError}
              productsLoadingMore={productsLoadingMore}
              productsHasMore={Boolean(productsHasMore)}
              onLoadMoreProducts={() => fetchMoreProducts()}
              onAddProduct={addProductToCart}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          </div>

          <div className="cashier-register__order-col">
            <PosOrderPanel
              showTotalsFoot={items.length > 0}
              items={items}
              total={total}
              selectedLineId={selectedLineId}
              onSelectLine={setSelectedLineId}
              onQtyDelta={handleQtyDelta}
              onUpdateQuantity={updateQuantity}
              onUpdatePrice={updateUnitPrice}
              onRemove={removeItem}
            />
          </div>

          <aside
            className={`cashier-register__actions-col${payOpen ? ' cashier-register__actions-col--pay' : ''}`}
          >
            <div className={payShellClassName}>
              <div
                className="cashier-register__pay-pane cashier-register__pay-pane--rail"
                inert={payOpen || undefined}
              >
                <PosRegisterPayRail
                  total={total}
                  onReturn={onReturn}
                  onDiscount={onDiscount}
                  onConfirm={handleConfirmPayment}
                  onOpenPaymentFlow={onOpenPaymentFlow}
                  checkoutDisabled={
                    items.length === 0 || checkoutMutation.isPending || !shiftIsOpen
                  }
                  isPending={checkoutMutation.isPending}
                />
              </div>

              {payOpen ? (
                <div className="cashier-register__pay-pane cashier-register__pay-pane--flow">
                  <PosPaymentFlow
                    key={`pay-flow-${payFlowSession}`}
                    onClose={onClosePayment}
                    total={total}
                    isPending={checkoutMutation.isPending}
                    onConfirm={handleConfirmPayment}
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
