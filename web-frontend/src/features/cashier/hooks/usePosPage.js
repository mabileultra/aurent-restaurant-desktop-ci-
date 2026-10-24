import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useCashierShiftView } from '../../../hooks/useCashierShiftView';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShiftModal } from '../../../contexts/CashierShiftModalContext';
import { useCartStore } from '../../../store/cartStore';
import { usePosCatalogViewMode } from './pos/usePosCatalogViewMode';
import { usePosProductsCatalog } from './pos/usePosProductsCatalog';
import { usePosNavigation } from './pos/usePosNavigation';
import { usePosCartHandlers } from './pos/usePosCartHandlers';
import { usePosCheckout } from './pos/usePosCheckout';
import { usePosSearchMarkAutoSubmit } from './pos/usePosSearchMarkAutoSubmit';
import { shouldAutoPromptCashierShift } from '../../../utils/shouldAutoPromptCashierShift';
import { usePharmacyIntegrationConfig } from '../../pharmacy-cashier/hooks/usePharmacyIntegrationConfig';

export function usePosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { storeId, noAssignment, multipleAssignment } = useCashierStore();
  const integration = usePharmacyIntegrationConfig(storeId);
  const [posPane, setPosPane] = useState('register');
  const [payOpen, setPayOpen] = useState(false);
  const [payFlowOptions, setPayFlowOptions] = useState(null);
  const [payFlowSession, setPayFlowSession] = useState(0);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const { open: shiftModalOpen, openShift: openShiftModal } = useCashierShiftModal();
  const shiftAutoPromptedRef = useRef(false);

  const items = useCartStore((s) => s.items);
  const addPieceItem = useCartStore((s) => s.addPieceItem);
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
  const holdCart = useCartStore((s) => s.holdCart);
  const restoreParkedCart = useCartStore((s) => s.restoreParkedCart);
  const removeParkedCart = useCartStore((s) => s.removeParkedCart);
  const clearParkedCarts = useCartStore((s) => s.clearParkedCarts);
  const parkedCarts = useCartStore((s) => s.parkedCarts);
  const hasParkedCart = parkedCarts.length > 0;
  const checkNo = useCartStore((s) => s.checkNo);
  const customerId = useCartStore((s) => s.customerId);
  const customerName = useCartStore((s) => s.customerName);
  const setCustomer = useCartStore((s) => s.setCustomer);

  const { viewMode, handleViewModeChange } = usePosCatalogViewMode();
  const catalog = usePosProductsCatalog({ storeId });

  const { handleClosePayment: closePaymentNav, handleGoToCatalog, handleGoToRegister } = usePosNavigation({
    posPane,
    setPosPane,
    payOpen,
    setPayOpen,
    searchActive: catalog.searchActive,
    viewMode,
    handleViewModeChange,
    catalogBrowse: catalog.catalogBrowse,
    setCatalogBrowse: catalog.setCatalogBrowse,
    setSelectedCategoryId: catalog.setSelectedCategoryId,
    setSearch: catalog.setSearch,
  });

  const handleClosePayment = () => {
    closePaymentNav();
  };

  const handleOpenPaymentFlow = (options) => {
    setPayFlowOptions(options);
    setPayFlowSession((session) => session + 1);
    setPosPane('register');
    setPayOpen(true);
  };

  const handlePayFlowClosed = useCallback(() => {
    setPayFlowOptions(null);
  }, []);

  const {
    shift,
    shiftIsOpen,
    shiftFetched,
    shiftFetching,
    shiftQueryError,
  } = useCashierShiftView(storeId);

  const total = getTotal();
  const linesTotal = getLinesTotal();
  const orderDiscount = getOrderDiscount();

  const { checkoutMutation, handleConfirmPayment } = usePosCheckout({
    storeId,
    total,
    setPayOpen,
    setSelectedLineId,
    shift,
  });

  const cartHandlers = usePosCartHandlers({
    storeId,
    shiftIsOpen,
    payOpen,
    returnOpen,
    shiftModalOpen,
    searchInputRef,
    products: catalog.products,
    productsStale: catalog.productsStale,
    search: catalog.search,
    setSearch: catalog.setSearch,
    addPieceItem,
    addWeightLine,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    selectedLineId,
    setSelectedLineId,
    cashRegisterId: shift?.cashRegisterId ?? null,
  });

  usePosSearchMarkAutoSubmit({
    search: catalog.search,
    onSearchChange: catalog.setSearch,
    onMarkingScan: (code) => cartHandlers.tryAddByMarking(code),
    enabled: Boolean(storeId) && shiftIsOpen && !payOpen && !returnOpen && !shiftModalOpen,
  });

  useEffect(() => {
    if (shiftAutoPromptedRef.current) return;
    if (
      !storeId
      || !shouldAutoPromptCashierShift({
        shiftFetched,
        shiftFetching,
        shiftStatus: shift?.status,
        shiftQueryError,
      })
    ) {
      return;
    }
    shiftAutoPromptedRef.current = true;
    openShiftModal();
  }, [storeId, shiftFetched, shiftFetching, shift?.status, shiftQueryError, openShiftModal]);

  useEffect(() => {
    if (location.state?.pane !== 'catalog') return;
    handleGoToCatalog();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state?.pane, handleGoToCatalog, navigate]);

  useEffect(() => {
    if (location.state?.pane !== 'register') return;
    handleGoToRegister();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state?.pane, handleGoToRegister, navigate]);

  useEffect(() => {
    if (storeId) searchInputRef.current?.focus();
  }, [storeId]);

  useEffect(() => {
    if (!returnOpen && !payOpen && storeId) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [returnOpen, payOpen, storeId]);

  const storeBlocked = noAssignment || multipleAssignment;

  const catalogProps = {
    storeId,
    viewMode,
    handleViewModeChange,
    search: catalog.search,
    setSearch: catalog.setSearch,
    categories: catalog.categories,
    categoriesLoading: catalog.categoriesLoading,
    categoriesError: catalog.categoriesError,
    selectedCategoryId: catalog.selectedCategoryId,
    handleSelectCategory: catalog.handleSelectCategory,
    setSelectedCategoryId: catalog.setSelectedCategoryId,
    searchActive: catalog.searchActive,
    catalogBrowse: catalog.catalogBrowse,
    setCatalogBrowse: catalog.setCatalogBrowse,
    products: catalog.products,
    productsLoading: catalog.productsLoading,
    productsStale: catalog.productsStale,
    productsError: catalog.productsError,
    productsLoadingMore: catalog.productsLoadingMore,
    productsHasMore: catalog.productsHasMore,
    fetchMoreProducts: catalog.fetchMoreProducts,
    addProductToCart: (product) => {
      if (catalog.productsStale) return;
      cartHandlers.addProductToCart(product);
    },
    handleSearchEnter: cartHandlers.handleSearchEnter,
  };

  const handleReturnSuccess = () => {
    qc.invalidateQueries({ queryKey: ['sales-ledger'] });
    qc.invalidateQueries({ queryKey: ['my-sales'] });
    qc.invalidateQueries({ queryKey: ['cashier-shift'] });
  };

  const handleDiscount = () => {
    if (items.length === 0) {
      toast.error(t('pos.cartEmpty'));
      return;
    }
    setDiscountOpen(true);
  };

  const handleHoldCart = useCallback(() => {
    if (returnOpen || discountOpen || payOpen) return;
    const result = holdCart();
    setSelectedLineId(null);
    if (result === 'held') {
      toast.success(t('pos.holdReceiptDone'));
      return;
    }
    if (result === 'restored') {
      toast.success(t('pos.restoreReceiptDone'));
      return;
    }
    if (result === 'full') {
      toast.error(t('pos.holdReceiptFull'));
      return;
    }
    if (result === 'choose') {
      toast(t('pos.holdReceiptChoose'));
      return;
    }
    toast.error(t('pos.holdReceiptEmpty'));
  }, [discountOpen, holdCart, payOpen, returnOpen, t]);

  const handleRestoreParked = useCallback(
    (parkedId) => {
      const result = restoreParkedCart(parkedId);
      setSelectedLineId(null);
      if (result === 'restored') {
        toast.success(t('pos.restoreReceiptDone'));
        return;
      }
      if (result === 'full') {
        toast.error(t('pos.holdReceiptFull'));
        return;
      }
      toast.error(t('pos.holdReceiptEmpty'));
    },
    [restoreParkedCart, t]
  );

  const handleRemoveParked = useCallback(
    (parkedId) => {
      removeParkedCart(parkedId);
      toast.success(t('pos.parkedCartRemoved'));
    },
    [removeParkedCart, t]
  );

  const handleClearParked = useCallback(() => {
    if (!parkedCarts.length) return;
    if (!window.confirm(t('pos.parkedCartsClearConfirm'))) return;
    clearParkedCarts();
    toast.success(t('pos.parkedCartsCleared'));
  }, [clearParkedCarts, parkedCarts.length, t]);

  const handleClearCart = useCallback(() => {
    if (items.length === 0) return;
    if (!window.confirm(t('pos.clearOrderConfirm'))) return;
    clearCart();
    setSelectedLineId(null);
    toast.success(t('pos.clearOrderDone'));
  }, [clearCart, items.length, t]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'F2' && !e.repeat) {
        e.preventDefault();
        if (posPane !== 'register') handleGoToRegister();
        queueMicrotask(() => searchInputRef.current?.focus?.());
        return;
      }
      if (e.key !== 'F6' || e.repeat) return;
      e.preventDefault();
      handleHoldCart();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleGoToRegister, handleHoldCart, posPane]);

  const handleSetCustomer = useCallback(
    (id, name) => {
      setCustomer(id, name);
      if (id) toast.success(t('pos.customerCardApplied', { name: name || '' }));
      else toast.success(t('pos.customerCardCleared'));
    },
    [setCustomer, t]
  );

  return {
    t,
    storeId,
    storeBlocked,
    noAssignment,
    searchInputRef,
    posPane,
    payOpen,
    returnOpen,
    setReturnOpen,
    discountOpen,
    setDiscountOpen,
    selectedLineId,
    setSelectedLineId,
    catalogProps,
    handleClosePayment,
    items,
    total,
    linesTotal,
    orderDiscount,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    cartHandlers,
    checkoutMutation,
    handleConfirmPayment,
    shiftIsOpen,
    handleReturnSuccess,
    handleDiscount,
    handleHoldCart,
    handleClearCart,
    hasParkedCart,
    parkedCarts,
    handleRestoreParked,
    handleRemoveParked,
    handleClearParked,
    checkNo,
    customerId,
    customerName,
    handleSetCustomer,
    handleOpenPaymentFlow,
    handlePayFlowClosed,
    payFlowOptions,
    payFlowSession,
    setOrderDiscountAmount,
    setOrderDiscountPercent,
    clearOrderDiscount,
  };
}
