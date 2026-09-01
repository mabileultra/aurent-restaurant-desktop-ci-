import PharmacyCartTable from './PharmacyCartTable';
import PharmacyProductSearchTable from './PharmacyProductSearchTable';
import PharmacyIntegrationToolbar from './PharmacyIntegrationToolbar';
import CashierRegisterShell from '../../cashier/components/shell/CashierRegisterShell';
import { useTranslation } from 'react-i18next';
import '../styles/pharmacy-cashier.css';

export default function PharmacyRegisterWorkspace({
  searchInputRef,
  catalog,
  integration,
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
  const { t } = useTranslation();
  const { checkoutMutation, handleConfirmPayment } = checkout;

  const focusSearch = () => {
    searchInputRef.current?.focus();
  };

  return (
    <CashierRegisterShell
      splitClassName="cashier-register__split--register pharmacy-cashier__split"
      pay={{
        payOpen,
        total: cart.total,
        onReturn,
        onDiscount,
        onConfirm: handleConfirmPayment,
        onOpenPaymentFlow,
        onClosePayment,
        checkoutDisabled:
          cart.items.length === 0 || checkoutMutation.isPending || !shiftIsOpen,
        isPending: checkoutMutation.isPending,
        payFlowOptions,
        payFlowSession,
        payFlowKeyPrefix: 'pharmacy-pay-flow',
        onPayFlowClosed,
      }}
    >
      <div className="cashier-register__order-col pharmacy-cashier__main">
        <section className="pharmacy-cashier__cart-pane" aria-label={t('pharmacyCashier.receiptTitle')}>
          <div className="pharmacy-cashier__pane-head">
            <h2 className="pharmacy-cashier__pane-title">{t('pharmacyCashier.receiptTitle')}</h2>
          </div>
          <PharmacyCartTable
            items={cart.items}
            selectedLineId={cart.selectedLineId}
            onSelectLine={cart.setSelectedLineId}
            onQtyDelta={cart.handleQtyDelta}
            onRemove={cart.removeItem}
          />
        </section>

        <section className="pharmacy-cashier__search-pane" aria-label={t('pharmacyCashier.searchTitle')}>
          <div className="pharmacy-cashier__pane-head pharmacy-cashier__pane-head--search">
            <h2 className="pharmacy-cashier__pane-title">{t('pharmacyCashier.searchTitle')}</h2>
            <input
              ref={searchInputRef}
              type="search"
              className="pharmacy-search__field pharmacy-search__field--compact"
              value={catalog.search}
              disabled={!catalog.storeId}
              placeholder={t('pharmacyCashier.searchPhMarking')}
              aria-label={t('pos.searchProducts')}
              onChange={(e) => catalog.setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  catalog.handleSearchEnter?.();
                }
              }}
            />
            <PharmacyIntegrationToolbar
              storeId={catalog.storeId}
              capabilities={integration.capabilities}
              externalUrls={integration.externalUrls}
              onFocusSearch={focusSearch}
              markingModal={integration.markingModal}
              onOpenMarking={() => integration.openMarkingModal()}
              onCloseMarking={integration.closeMarkingModal}
            />
          </div>
          <PharmacyProductSearchTable
            hideSearchField
            storeId={catalog.storeId}
            search={catalog.search}
            onSearchChange={catalog.setSearch}
            onSearchEnter={catalog.handleSearchEnter}
            products={catalog.products}
            productsLoading={catalog.productsLoading}
            productsError={catalog.productsError}
            productsLoadingMore={catalog.productsLoadingMore}
            productsHasMore={Boolean(catalog.productsHasMore)}
            onLoadMore={() => catalog.fetchMoreProducts()}
            onSelectProduct={catalog.addProductToCart}
            scanDisabled={!catalog.storeId}
          />
        </section>
      </div>
    </CashierRegisterShell>
  );
}
