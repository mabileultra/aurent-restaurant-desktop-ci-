import React from 'react';
import PosCatalogPanel from '../PosCatalogPanel';
import PosOrderPanel from '../PosOrderPanel';
import PosCustomerCardModal from '../pos-order-panel/PosCustomerCardModal';
import CashierRegisterShell from '../shell/CashierRegisterShell';
import { usePosRegisterWorkspaceState } from './usePosRegisterWorkspaceState';

export default function PosRegisterWorkspace(props) {
  const {
    posPane,
    searchInputRef,
    catalog,
    cart,
  } = props;

  const {
    showRegisterFinder,
    payProps,
    registerFinder,
    customerCardOpen,
    setCustomerCardOpen,
    customerId,
    customerName,
    onSetCustomer,
  } = usePosRegisterWorkspaceState(props);

  return (
    <CashierRegisterShell
      splitClassName={`cashier-register__split--${posPane}`}
      pay={payProps}
    >
      <div className="cashier-register__catalog-col">
        <PosCatalogPanel
          ref={showRegisterFinder ? undefined : searchInputRef}
          search={catalog.search}
          onSearchChange={catalog.setSearch}
          onSearchEnter={catalog.handleSearchEnter}
          scanDisabled={!catalog.storeId}
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
          productsHasMore={Boolean(catalog.productsHasMore)}
          onLoadMoreProducts={() => catalog.fetchMoreProducts()}
          onAddProduct={catalog.addProductToCart}
          viewMode={catalog.viewMode}
          onViewModeChange={catalog.handleViewModeChange}
          hideQuickFilters
        />
      </div>

      <div className="cashier-register__order-col">
        <PosOrderPanel
          showTotalsFoot={cart.items.length > 0 || cart.hasParkedCart}
          items={cart.items}
          total={cart.total}
          selectedLineId={cart.selectedLineId}
          onSelectLine={cart.setSelectedLineId}
          onQtyDelta={cart.handleQtyDelta}
          onUpdateQuantity={cart.updateQuantity}
          onUpdatePrice={cart.updateUnitPrice}
          onRemove={cart.removeItem}
          onHold={cart.onHold}
          onClear={cart.onClear}
          hasParkedCart={cart.hasParkedCart}
          parkedCarts={cart.parkedCarts}
          onRestoreParked={cart.onRestoreParked}
          onRemoveParked={cart.onRemoveParked}
          onClearParked={cart.onClearParked}
          searchInputRef={showRegisterFinder ? searchInputRef : null}
          registerFinder={registerFinder}
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
