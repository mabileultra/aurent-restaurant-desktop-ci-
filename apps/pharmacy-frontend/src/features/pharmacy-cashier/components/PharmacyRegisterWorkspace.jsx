import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { loadCatalogColumnVisibility } from '../constants/pharmacyCatalogColumns';
import PharmacyCartTable from './PharmacyCartTable';
import PharmacyCartPaneHead from './PharmacyCartPaneHead';
import PharmacyPreviewModal from './PharmacyPreviewModal';
import PharmacyCatalogToolbar from './PharmacyCatalogToolbar';
import PharmacyProductSearchTable from './PharmacyProductSearchTable';
import PharmacySearchStrip from './PharmacySearchStrip';
import PharmacyStockProductCount from './PharmacyStockProductCount';
import PharmacyPayColumn from './PharmacyPayColumn';
import CashierRegisterShell from '../../cashier/components/shell/CashierRegisterShell';
import { focusPharmacyScanField } from '../utils/focusPharmacyScanField';
import '../styles/pharmacy-cashier.css';
import '../styles/pharmacy-catalog-toolbar.css';

const CATALOG_AUTO_REFRESH_MS = 60_000;

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
  onHold,
  onCashIn,
  onCashOut,
  onOpenPaymentFlow,
  payFlowOptions,
  payFlowSession,
  onPayFlowClosed,
  markingNotice = null,
  clearMarkingNotice,
  onRefreshCatalog,
}) {
  const { t } = useTranslation();
  const { checkoutMutation, handleConfirmPayment } = checkout;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [parkedOpenSignal, setParkedOpenSignal] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(loadCatalogColumnVisibility);

  useEffect(() => {
    if (!autoRefresh || !onRefreshCatalog) return undefined;
    const id = window.setInterval(() => {
      onRefreshCatalog();
    }, CATALOG_AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, onRefreshCatalog]);

  const focusSearch = () => {
    focusPharmacyScanField({ kmInputRef, searchInputRef });
  };

  useEffect(() => {
    if (!markingNotice) return;
    toast.error(markingNotice);
    clearMarkingNotice?.();
  }, [markingNotice, clearMarkingNotice]);

  const handlePreviewCheck = () => {
    if (!cart.items.length) {
      toast.error(t('pos.cartEmpty'));
      return;
    }
    setPreviewOpen(true);
  };

  const handlePrintPreview = () => {
    try {
      window.print();
    } catch {
      /* ignore */
    }
  };

  const handleParkedList = () => {
    const n = cart.parkedCarts?.length || 0;
    if (n > 0) {
      setParkedOpenSignal((v) => v + 1);
      setPreviewOpen(false);
      return;
    }
    toast(t('pharmacyCashier.pay.parkedListEmpty'));
  };

  const handleRefresh = async () => {
    if (!onRefreshCatalog) return;
    setRefreshing(true);
    try {
      await onRefreshCatalog();
    } finally {
      setRefreshing(false);
    }
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
        onHold,
        onPreviewCheck: handlePreviewCheck,
        onParkedList: handleParkedList,
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
            parkedOpenSignal={parkedOpenSignal}
          />
          <PharmacyCartTable
            items={cart.items}
            total={cart.total}
            selectedLineId={cart.selectedLineId}
            onSelectLine={(lineId) => {
              setPreviewOpen(false);
              cart.setSelectedLineId(lineId);
            }}
            onQtyDelta={cart.handleQtyDelta}
            onRemove={cart.removeItem}
            onUpdatePrice={cart.onUpdatePrice}
          />
        </section>

        <section className="pharmacy-cashier__search-pane" aria-label={t('pharmacyCashier.searchTitle')}>
          <div className="pharmacy-cashier__pane-head pharmacy-cashier__pane-head--search">
            <div className="pharmacy-cashier__pane-title-wrap">
              <h2 className="pharmacy-cashier__pane-title">{t('pharmacyCashier.searchTitle')}</h2>
              <PharmacyCatalogToolbar
                onRefresh={handleRefresh}
                refreshing={refreshing}
                autoRefresh={autoRefresh}
                onAutoRefreshChange={setAutoRefresh}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
              />
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
            visibleColumns={columnVisibility}
          />
          <PharmacyStockProductCount t={t} count={catalog.productsTotal} />
        </section>
      <PharmacyPreviewModal
        open={previewOpen && cart.items.length > 0}
        onClose={() => setPreviewOpen(false)}
        receiptNo={cart.checkNo}
        items={cart.items}
        total={cart.total}
        onPrint={handlePrintPreview}
      />
    </CashierRegisterShell>
  );
}
