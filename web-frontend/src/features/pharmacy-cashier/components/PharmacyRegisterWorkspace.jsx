import PharmacyCartTable from './PharmacyCartTable';
import PharmacyProductSearchTable from './PharmacyProductSearchTable';
import PharmacyPayRail from './PharmacyPayRail';
import PosPaymentFlow from '../../cashier/components/PosPaymentFlow';
import { usePayFlowTransition } from '../../cashier/hooks/usePayFlowTransition';
import CashierBottomNav from '../../../components/layout/cashier/bottom-nav/CashierBottomNav';
import { useTranslation } from 'react-i18next';
import '../styles/pharmacy-cashier.css';

export default function PharmacyRegisterWorkspace({
  searchInputRef,
  catalog,
  payOpen,
  onClosePayment,
  cart,
  checkout,
  shiftIsOpen,
  linesTotal,
  orderDiscount,
  onReturn,
  onDiscount,
  onOpenPaymentFlow,
  payFlowOptions,
  payFlowSession,
  onPayFlowClosed,
}) {
  const { t } = useTranslation();
  const { checkoutMutation, handleConfirmPayment } = checkout;
  usePayFlowTransition(payOpen, onPayFlowClosed);

  const checkoutDisabled =
    cart.items.length === 0 || checkoutMutation.isPending || !shiftIsOpen;

  return (
    <div className="pharmacy-cashier__split">
      <div className="pharmacy-cashier__stage">
        <div className="pharmacy-cashier__main">
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
            <div className="pharmacy-cashier__pane-head">
              <h2 className="pharmacy-cashier__pane-title">{t('pharmacyCashier.searchTitle')}</h2>
            </div>
            <PharmacyProductSearchTable
              ref={searchInputRef}
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

        <aside className={`pharmacy-cashier__actions${payOpen ? ' pharmacy-cashier__actions--pay' : ''}`}>
          <div className="pharmacy-cashier__pay-shell">
            <div className="pharmacy-cashier__pay-pane" inert={payOpen || undefined}>
              <PharmacyPayRail
                linesTotal={linesTotal}
                orderDiscount={orderDiscount}
                total={cart.total}
                onReturn={onReturn}
                onDiscount={onDiscount}
                onConfirm={handleConfirmPayment}
                onOpenPaymentFlow={onOpenPaymentFlow}
                checkoutDisabled={checkoutDisabled}
                isPending={checkoutMutation.isPending}
                hotkeysEnabled={!payOpen}
              />
            </div>

            {payOpen ? (
              <div className="pharmacy-cashier__pay-pane pharmacy-cashier__pay-pane--flow">
                <PosPaymentFlow
                  key={`pharmacy-pay-flow-${payFlowSession}`}
                  onClose={onClosePayment}
                  total={cart.total}
                  isPending={checkoutMutation.isPending}
                  onConfirm={handleConfirmPayment}
                  openOptions={payFlowOptions}
                />
              </div>
            ) : null}
          </div>
        </aside>

        <CashierBottomNav className="pharmacy-cashier__bottom-nav" />
      </div>
    </div>
  );
}
