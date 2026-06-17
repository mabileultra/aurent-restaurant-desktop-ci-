import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useCashierShift } from '../../../hooks/useCashierShift';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShiftModal } from '../../../contexts/CashierShiftModalContext';
import { useCartStore } from '../../../store/cartStore';
import { usePosCatalogViewMode } from './pos/usePosCatalogViewMode';
import { usePosProductsCatalog } from './pos/usePosProductsCatalog';
import { usePosNavigation } from './pos/usePosNavigation';
import { usePosCartHandlers } from './pos/usePosCartHandlers';
import { usePosCheckout } from './pos/usePosCheckout';

export function usePosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { storeId, noAssignment, multipleAssignment } = useCashierStore();
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

  const { data: shift, isFetched: shiftFetched } = useCashierShift(storeId);
  const shiftIsOpen = shift?.status === 'OPEN';

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
    search: catalog.search,
    setSearch: catalog.setSearch,
    addPieceItem,
    addWeightLine,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    selectedLineId,
    setSelectedLineId,
  });

  useEffect(() => {
    if (shiftAutoPromptedRef.current) return;
    if (!storeId || !shiftFetched || shiftIsOpen) return;
    shiftAutoPromptedRef.current = true;
    openShiftModal();
  }, [storeId, shiftFetched, shiftIsOpen, openShiftModal]);

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
    searchActive: catalog.searchActive,
    catalogBrowse: catalog.catalogBrowse,
    setCatalogBrowse: catalog.setCatalogBrowse,
    products: catalog.products,
    productsLoading: catalog.productsLoading,
    productsError: catalog.productsError,
    productsLoadingMore: catalog.productsLoadingMore,
    productsHasMore: catalog.productsHasMore,
    fetchMoreProducts: catalog.fetchMoreProducts,
    addProductToCart: cartHandlers.addProductToCart,
    handleSearchEnter: cartHandlers.handleSearchEnter,
  };

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
    handleOpenPaymentFlow,
    handlePayFlowClosed,
    payFlowOptions,
    payFlowSession,
    setOrderDiscountAmount,
    setOrderDiscountPercent,
    clearOrderDiscount,
  };
}
