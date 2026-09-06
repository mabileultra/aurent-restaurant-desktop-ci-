import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useCashierShift } from '../../../hooks/useCashierShift';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShiftModal } from '../../../contexts/CashierShiftModalContext';
import { usePosShell } from '../../../contexts/PosShellContext';
import { useCashierCompactLayout } from '../../../hooks/useCashierCompactLayout';
import { useCartStore } from '../../../store/cartStore';
import { usePosProductsCatalog } from '../../cashier/hooks/pos/usePosProductsCatalog';
import { usePosCheckout } from '../../cashier/hooks/pos/usePosCheckout';
import { shouldAutoPromptCashierShift } from '../../../utils/shouldAutoPromptCashierShift';
import { usePharmacyCartHandlers } from './usePharmacyCartHandlers';
import { usePharmacyCheckoutLineItems } from '../utils/pharmacyCartActions';
import { usePharmacyIntegrationConfig } from './usePharmacyIntegrationConfig';
import { usePharmacyMarkingModalState } from './usePharmacyIntegrationToolbar';
import { usePharmacyMarkingScan } from './usePharmacyMarkingScan';
import { usePharmacyHotkeys } from './usePharmacyHotkeys';
import {
  bumpPharmacyDraftReceiptNo,
  readPharmacyDraftReceiptNo,
} from '../utils/pharmacyDraftReceiptNo';

export function usePharmacyPosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { storeId, noAssignment, multipleAssignment } = useCashierStore();
  const { setShell } = usePosShell() ?? {};
  const layoutCompact = useCashierCompactLayout();
  const [payOpen, setPayOpen] = useState(false);
  const [payFlowOptions, setPayFlowOptions] = useState(null);
  const [payFlowSession, setPayFlowSession] = useState(0);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const { open: shiftModalOpen, openShift: openShiftModal } = useCashierShiftModal();
  const shiftAutoPromptedRef = useRef(false);

  const items = useCartStore((s) => s.items);
  const addWeightLine = useCartStore((s) => s.addWeightLine);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateUnitPrice = useCartStore((s) => s.updateUnitPrice);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotal = useCartStore((s) => s.getTotal);
  const getLinesTotal = useCartStore((s) => s.getLinesTotal);
  const getOrderDiscount = useCartStore((s) => s.getOrderDiscount);
  const setOrderDiscountAmount = useCartStore((s) => s.setOrderDiscountAmount);
  const setOrderDiscountPercent = useCartStore((s) => s.setOrderDiscountPercent);
  const clearOrderDiscount = useCartStore((s) => s.clearOrderDiscount);
  const clearCart = useCartStore((s) => s.clearCart);

  const [draftReceiptNo, setDraftReceiptNo] = useState(() => readPharmacyDraftReceiptNo(storeId));

  useEffect(() => {
    setDraftReceiptNo(readPharmacyDraftReceiptNo(storeId));
  }, [storeId]);

  const catalog = usePosProductsCatalog({ storeId });
  const integration = usePharmacyIntegrationConfig(storeId);
  const { markingModal, openMarkingModal, closeMarkingModal } = usePharmacyMarkingModalState();
  const onMarkingScanRef = useRef(async () => false);

  useEffect(() => {
    catalog.setCatalogBrowse('products');
  }, [catalog.setCatalogBrowse]);

  const handleClosePayment = useCallback(() => {
    setPayOpen(false);
  }, []);

  const handleOpenPaymentFlow = useCallback((options) => {
    setPayFlowOptions(options ?? null);
    setPayFlowSession((session) => session + 1);
    setPayOpen(true);
  }, []);

  const handlePayFlowClosed = useCallback(() => {
    setPayFlowOptions(null);
  }, []);

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const focusCart = useCallback(() => {
    const pane = document.querySelector('.pharmacy-cashier__cart-pane');
    if (!(pane instanceof HTMLElement)) return;
    pane.focus({ preventScroll: false });
    pane.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  const handleClearCart = useCallback(() => {
    if (items.length === 0) return false;
    if (!window.confirm(t('pos.clearOrderConfirm'))) return false;
    clearCart();
    setSelectedLineId(null);
    toast.success(t('pos.clearOrderDone'));
    return true;
  }, [clearCart, items.length, t]);

  const handleNewReceipt = useCallback(() => {
    if (items.length > 0) {
      if (!window.confirm(t('pharmacyCashier.newReceiptConfirm'))) return;
      clearCart();
      setSelectedLineId(null);
    }
    const next = bumpPharmacyDraftReceiptNo(storeId);
    setDraftReceiptNo(next);
    catalog.setSearch('');
    focusSearch();
    toast.success(t('pharmacyCashier.newReceiptDone', { n: next }));
  }, [catalog.setSearch, clearCart, focusSearch, items.length, storeId, t]);

  const handleGoToCatalog = useCallback(() => {
    setPayOpen(false);
    focusSearch();
  }, [focusSearch]);

  const handleGoToRegister = useCallback(() => {
    setPayOpen(false);
    focusSearch();
  }, [focusSearch]);

  useEffect(() => {
    if (!setShell) return undefined;
    setShell({
      posPane: 'register',
      layoutCompact,
      payOpen,
      catalogBrowse: 'products',
      onGoToCatalog: handleGoToCatalog,
      onGoToRegister: handleGoToRegister,
      onClosePayment: handleClosePayment,
      searchActive: catalog.searchActive,
      viewMode: 'list',
      onViewModeChange: undefined,
    });
    return () => setShell(null);
  }, [
    setShell,
    layoutCompact,
    payOpen,
    handleGoToCatalog,
    handleGoToRegister,
    handleClosePayment,
    catalog.searchActive,
  ]);

  const { data: shift, isFetched: shiftFetched, error: shiftQueryError } = useCashierShift(storeId);
  const shiftIsOpen = shift?.status === 'OPEN';

  const total = getTotal();
  const linesTotal = getLinesTotal();
  const orderDiscount = getOrderDiscount();

  const getPharmacyCheckoutLineItems = usePharmacyCheckoutLineItems();

  const { checkoutMutation, handleConfirmPayment } = usePosCheckout({
    storeId,
    total,
    setPayOpen,
    setSelectedLineId,
    shift,
    getCheckoutLineItems: getPharmacyCheckoutLineItems,
  });

  useEffect(() => {
    if (!checkoutMutation.isSuccess) return;
    setDraftReceiptNo(bumpPharmacyDraftReceiptNo(storeId));
  }, [checkoutMutation.isSuccess, checkoutMutation.dataUpdatedAt, storeId]);

  const cartHandlers = usePharmacyCartHandlers({
    storeId,
    shiftIsOpen,
    payOpen,
    returnOpen,
    shiftModalOpen,
    searchInputRef,
    products: catalog.products,
    search: catalog.search,
    setSearch: catalog.setSearch,
    addWeightLine,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    selectedLineId,
    setSelectedLineId,
    onMarkingScan: (code, opts) => onMarkingScanRef.current(code, opts),
  });

  const markingScan = usePharmacyMarkingScan({
    storeId,
    aslMarkingEnabled: integration.capabilities.aslMarkingEnabled,
    products: catalog.products,
    onProductFound: cartHandlers.addProductToCart,
    onOpenMarkingModal: openMarkingModal,
  });

  onMarkingScanRef.current = markingScan.tryHandleMarkingScan;

  useEffect(() => {
    if (shiftAutoPromptedRef.current) return;
    if (!storeId || !shouldAutoPromptCashierShift({ shiftFetched, shiftIsOpen, shiftQueryError })) {
      return;
    }
    shiftAutoPromptedRef.current = true;
    openShiftModal();
  }, [storeId, shiftFetched, shiftIsOpen, shiftQueryError, openShiftModal]);

  useEffect(() => {
    if (location.state?.pane !== 'catalog' && location.state?.pane !== 'register') return;
    handleGoToRegister();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state?.pane, handleGoToRegister, navigate]);

  useEffect(() => {
    if (storeId) focusSearch();
  }, [storeId, focusSearch]);

  useEffect(() => {
    if (
      !returnOpen
      && !payOpen
      && !cartHandlers.qtyModalProduct
      && !cartHandlers.weightModalProduct
      && storeId
    ) {
      const timer = setTimeout(() => focusSearch(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    returnOpen,
    payOpen,
    cartHandlers.qtyModalProduct,
    cartHandlers.weightModalProduct,
    storeId,
    focusSearch,
  ]);

  usePharmacyHotkeys({
    t,
    enabled: Boolean(storeId) && !(noAssignment || multipleAssignment),
    focusSearch,
    focusCart,
    itemsLength: items.length,
    payOpen,
    returnOpen,
    discountOpen,
    qtyModalOpen: Boolean(cartHandlers.qtyModalProduct),
    weightModalOpen: Boolean(cartHandlers.weightModalProduct),
    markingOpen: Boolean(markingModal?.open),
    onClosePayment: handleClosePayment,
    onClearCart: handleClearCart,
    clearSearch: () => catalog.setSearch(''),
  });

  const handleReturnSuccess = () => {
    qc.invalidateQueries({ queryKey: ['sales-ledger'] });
    qc.invalidateQueries({ queryKey: ['my-sales'] });
    qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
  };

  const handleDiscount = () => {
    if (items.length === 0) {
      toast.error(t('pos.cartEmpty'));
      return;
    }
    setDiscountOpen(true);
  };

  const storeBlocked = noAssignment || multipleAssignment;

  return {
    t,
    storeId,
    storeBlocked,
    noAssignment,
    searchInputRef,
    payOpen,
    returnOpen,
    setReturnOpen,
    discountOpen,
    setDiscountOpen,
    selectedLineId,
    setSelectedLineId,
    handleClosePayment,
    handleClearCart,
    handleNewReceipt,
    draftReceiptNo,
    items,
    total,
    linesTotal,
    orderDiscount,
    removeItem,
    cartHandlers,
    checkoutMutation,
    handleConfirmPayment,
    shiftIsOpen,
    handleReturnSuccess,
    handleDiscount,
    handleOpenPaymentFlow,
    handlePayFlowClosed,
    payFlowOptions,
    payFlowSession,
    setOrderDiscountAmount,
    setOrderDiscountPercent,
    clearOrderDiscount,
    catalog: {
      storeId,
      search: catalog.search,
      setSearch: catalog.setSearch,
      products: catalog.products,
      productsLoading: catalog.productsLoading,
      productsError: catalog.productsError,
      productsLoadingMore: catalog.productsLoadingMore,
      productsHasMore: catalog.productsHasMore,
      fetchMoreProducts: catalog.fetchMoreProducts,
      addProductToCart: cartHandlers.addProductToCart,
      handleSearchEnter: cartHandlers.handleSearchEnter,
    },
    integration: {
      capabilities: integration.capabilities,
      externalUrls: integration.externalUrls,
      markingModal,
      openMarkingModal,
      closeMarkingModal,
      markingVerifying: markingScan.verifying,
    },
  };
}
