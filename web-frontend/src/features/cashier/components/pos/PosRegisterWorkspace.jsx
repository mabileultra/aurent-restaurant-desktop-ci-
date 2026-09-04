import PosCatalogPanel from '../PosCatalogPanel';
import PosOrderPanel from '../PosOrderPanel';
import CashierRegisterShell from '../shell/CashierRegisterShell';

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
    onHold,
    onClear,
    hasParkedCart,
  } = cart;

  const { checkoutMutation, handleConfirmPayment } = checkout;

  return (
    <CashierRegisterShell
      splitClassName={`cashier-register__split--${posPane}`}
      pay={{
        payOpen,
        total,
        onReturn,
        onDiscount,
        onConfirm: handleConfirmPayment,
        onOpenPaymentFlow,
        onClosePayment,
        checkoutDisabled:
          items.length === 0 || checkoutMutation.isPending || !shiftIsOpen,
        isPending: checkoutMutation.isPending,
        payFlowOptions,
        payFlowSession,
        onPayFlowClosed,
      }}
    >
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
          showTotalsFoot={items.length > 0 || hasParkedCart}
          items={items}
          total={total}
          selectedLineId={selectedLineId}
          onSelectLine={setSelectedLineId}
          onQtyDelta={handleQtyDelta}
          onUpdateQuantity={updateQuantity}
          onUpdatePrice={updateUnitPrice}
          onRemove={removeItem}
          onHold={onHold}
          onClear={onClear}
          hasParkedCart={hasParkedCart}
        />
      </div>
    </CashierRegisterShell>
  );
}
