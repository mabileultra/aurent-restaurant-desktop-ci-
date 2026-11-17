import { useCallback, useEffect, useRef, useState } from 'react';
import { ALL_CATEGORY_ID } from '../../hooks/usePosCatalogPanel';
import { useCartStore } from '../../../../store/cartStore';
import { nextRegisterScanBurst } from './registerScanBurst';

export function usePosRegisterWorkspaceState({
  posPane,
  catalog,
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
  const { checkoutMutation, handleConfirmPayment } = checkout;
  const ensureCheckNo = useCartStore((s) => s.ensureCheckNo);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hidePickerForScan, setHidePickerForScan] = useState(false);
  const [customerCardOpen, setCustomerCardOpen] = useState(false);
  const scanBurstRef = useRef({ at: 0, len: 0, burst: false });

  const {
    storeId,
    search,
    setSearch,
    handleSearchEnter,
    categories,
    categoriesLoading,
    selectedCategoryId,
    handleSelectCategory,
    setSelectedCategoryId,
    searchActive,
    setCatalogBrowse,
    products,
    productsLoading,
    productsError,
    productsLoadingMore,
    productsHasMore,
    fetchMoreProducts,
    addProductToCart,
  } = catalog;

  const {
    items,
    total,
    checkNo,
    customerId,
    customerName,
    onSetCustomer,
  } = cart;

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
      const next = nextRegisterScanBurst(scanBurstRef.current, value);
      scanBurstRef.current = next;
      setSearch(value);
      if (next.burst) {
        setHidePickerForScan(true);
        setPickerOpen(false);
        return;
      }
      setHidePickerForScan(false);
      if (String(value).trim()) openPicker();
    },
    [openPicker, setSearch]
  );

  useEffect(() => {
    if (String(search).trim()) return;
    setHidePickerForScan(false);
    scanBurstRef.current = { at: 0, len: 0, burst: false };
  }, [search]);

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

  const showRegisterFinder = posPane === 'register';
  const pickerVisible = !hidePickerForScan && (pickerOpen || searchActive);

  const payProps = {
    payOpen,
    total,
    onReturn,
    onDiscount,
    onCashIn,
    onCashOut,
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
  };

  const registerFinder = showRegisterFinder
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
        onAddProduct: addProductToCart,
        viewMode: 'list',
      }
    : null;

  return {
    showRegisterFinder,
    payProps,
    registerFinder,
    customerCardOpen,
    setCustomerCardOpen,
    customerId,
    customerName,
    onSetCustomer,
  };
}
