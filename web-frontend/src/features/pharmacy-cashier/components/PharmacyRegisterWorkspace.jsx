import PharmacyCartTable from './PharmacyCartTable';
import PharmacyCartPaneHead from './PharmacyCartPaneHead';
import PharmacyProductSearchTable from './PharmacyProductSearchTable';
import PharmacySearchStrip from './PharmacySearchStrip';
import PharmacyStockProductCount from './PharmacyStockProductCount';
import PharmacyPayColumn from './PharmacyPayColumn';
import CashierRegisterShell from '../../cashier/components/shell/CashierRegisterShell';
import { useTranslation } from 'react-i18next';
import { focusPharmacyScanField } from '../utils/focusPharmacyScanField';
import '../styles/pharmacy-cashier.css';

export default function PharmacyRegisterWorkspace({
  searchInputRef,
  kmInputRef,
  catalog,
  integration,
  payOpen,
  onClosePayment,
  cart,
  checkout,
  shiftIsOpen,
  onReturn,
  onDiscount,
  onCashIn,
  onCashOut,
  onOpenPaymentFlow,
  payFlowOptions,
  payFlowSession,
  onPayFlowClosed,
}) {
  const { t } = useTranslation();
  const { checkoutMutation, handleConfirmPayment } = checkout;

  const focusSearch = () => {
    focusPharmacyScanField({ kmInputRef, searchInputRef });
  };

  return (
    <CashierRegisterShell
      splitClassName="cashier-register__split--register pharmacy-cashier__split"
      PayColumn={PharmacyPayColumn}
      pay={{
        payOpen,
        total: cart.total,
        onReturn,
        onDiscount,
        onCashIn,
        onCashOut,
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
        <section
          className="pharmacy-cashier__cart-pane"
          aria-label={t('pharmacyCashier.receiptTitle')}
          tabIndex={-1}
        >
          <PharmacyCartPaneHead
            receiptNo={cart.checkNo}
            itemsCount={cart.items.length}
            parkedCarts={cart.parkedCarts}
            onRestoreParked={cart.onRestoreParked}
            onRemoveParked={cart.onRemoveParked}
            onClearParked={cart.onClearParked}
            onNewReceipt={cart.onNewReceipt}
            onClear={cart.onClearCart}
            disabled={checkoutMutation.isPending}
          />
          <PharmacyCartTable
            items={cart.items}
            selectedLineId={cart.selectedLineId}
            onSelectLine={cart.setSelectedLineId}
            onQtyDelta={cart.handleQtyDelta}
            onRemove={cart.removeItem}
            onUpdatePrice={cart.onUpdatePrice}
          />
        </section>

        <section className="pharmacy-cashier__search-pane" aria-label={t('pharmacyCashier.searchTitle')}>
          <div className="pharmacy-cashier__pane-head pharmacy-cashier__pane-head--search">
            <div className="pharmacy-cashier__pane-title-wrap">
              <h2 className="pharmacy-cashier__pane-title">{t('pharmacyCashier.searchTitle')}</h2>
              <PharmacyStockProductCount t={t} count={catalog.productsTotal} />
            </div>
            <PharmacySearchStrip
              searchInputRef={searchInputRef}
              kmInputRef={kmInputRef}
              search={catalog.search}
              onSearchChange={catalog.setSearch}
              onSearchEnter={catalog.handleSearchEnter}
              onMarkingScan={catalog.onMarkingScan}
              scanDisabled={!catalog.storeId}
              capabilities={integration.capabilities}
              externalUrls={integration.externalUrls}
              onFocusSearch={focusSearch}
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
            productsStale={catalog.productsStale}
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
