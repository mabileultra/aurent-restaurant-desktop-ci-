import { useCallback, useEffect, useState } from 'react';
import PosCatalogPanel from '../PosCatalogPanel';
import PosOrderPanel from '../PosOrderPanel';
import PosCustomerCardModal from '../pos-order-panel/PosCustomerCardModal';
import CashierRegisterShell from '../shell/CashierRegisterShell';
import { ALL_CATEGORY_ID } from '../../hooks/usePosCatalogPanel';
import { useCartStore } from '../../../../store/cartStore';

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
    setSelectedCategoryId,
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
    parkedCarts,
    onRestoreParked,
    onRemoveParked,
    onClearParked,
    checkNo,
    customerId,
    customerName,
    onSetCustomer,
  } = cart;

  const { checkoutMutation, handleConfirmPayment } = checkout;
  const ensureCheckNo = useCartStore((s) => s.ensureCheckNo);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customerCardOpen, setCustomerCardOpen] = useState(false);

  useEffect(() => {
    if (!checkNo) ensureCheckNo();
  }, [checkNo, ensureCheckNo]);

  useEffect(() => {
    if (posPane !== 'register') setPickerOpen(false);
  }, [posPane]);

  const openPicker = useCallback(() => setPickerOpen(true), []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setSearch('');
    setSelectedCategoryId?.(ALL_CATEGORY_ID);
    setCatalogBrowse?.('categories');
  }, [setCatalogBrowse, setSearch, setSelectedCategoryId]);

  const handleSearchChange = useCallback(
    (value) => {
      setSearch(value);
      if (String(value).trim()) openPicker();
    },
    [openPicker, setSearch]
  );

  const handleQuickFilter = useCallback(
    (categoryId) => {
      const sameChip =
        pickerOpen && !searchActive && selectedCategoryId === categoryId;
      if (sameChip) {
        closePicker();
        return;
      }
      setSearch('');
      handleSelectCategory(categoryId);
      openPicker();
    },
    [
      closePicker,
      handleSelectCategory,
      openPicker,
      pickerOpen,
      searchActive,
      selectedCategoryId,
      setSearch,
    ]
  );

  const handleAddFromPicker = useCallback(
    (product) => {
      addProductToCart(product);
    },
    [addProductToCart]
  );

  const showRegisterFinder = posPane === 'register';
  const pickerVisible = pickerOpen || searchActive;

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
        cartCustomer: customerId
          ? { id: customerId, name: customerName || '' }
          : null,
      }}
    >
      <div className="cashier-register__catalog-col">
        <PosCatalogPanel
          ref={showRegisterFinder ? undefined : searchInputRef}
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
          hideQuickFilters
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
          parkedCarts={parkedCarts}
          onRestoreParked={onRestoreParked}
          onRemoveParked={onRemoveParked}
          onClearParked={onClearParked}
          searchInputRef={showRegisterFinder ? searchInputRef : null}
          registerFinder={
            showRegisterFinder
              ? {
                  checkNo,
                  customerName,
                  onOpenCustomerCard: () => setCustomerCardOpen(true),
                  search,
                  onSearchChange: handleSearchChange,
                  onSearchEnter: handleSearchEnter,
                  scanDisabled: !storeId,
                  categories,
                  categoriesLoading,
                  selectedCategoryId,
                  searchActive,
                  onSelectQuickFilter: handleQuickFilter,
                  pickerOpen: pickerVisible,
                  onClosePicker: closePicker,
                  products,
                  productsLoading,
                  productsError,
                  productsLoadingMore,
                  productsHasMore: Boolean(productsHasMore),
                  onLoadMoreProducts: () => fetchMoreProducts(),
                  onAddProduct: handleAddFromPicker,
                  viewMode: 'list',
                }
              : null
          }
        />
      </div>

      <PosCustomerCardModal
        open={customerCardOpen}
        onClose={() => setCustomerCardOpen(false)}
        initialCustomerId={customerId}
        initialCustomerName={customerName}
        onSelect={({ id, name }) => onSetCustomer?.(id, name)}
      />
    </CashierRegisterShell>
  );
}
