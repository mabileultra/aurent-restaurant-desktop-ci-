import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCashierShiftView } from '../../../hooks/useCashierShiftView';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShiftModal } from '../../../contexts/CashierShiftModalContext';
import { usePosCatalogViewMode } from './pos/usePosCatalogViewMode';
import { usePosProductsCatalog } from './pos/usePosProductsCatalog';
import { usePosNavigation } from './pos/usePosNavigation';
import { usePosCartHandlers } from './pos/usePosCartHandlers';
import { usePosCheckout } from './pos/usePosCheckout';
import { usePosSearchMarkAutoSubmit } from './pos/usePosSearchMarkAutoSubmit';
import { useCashierCashMovement } from './useCashierCashMovement';
import { usePosCartActions } from './pos/usePosCartActions';
import { usePosHotkeys } from './pos/usePosHotkeys';
import { buildPosCatalogProps } from './pos/posCatalogProps';
import { usePosCartStoreBindings } from './pos/usePosCartStoreBindings';
import { usePosPageEffects } from './pos/usePosPageEffects';
import { usePosPaymentFlow } from './pos/usePosPaymentFlow';

export function usePosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const searchInputRef = useRef(null);
  const { storeId, noAssignment, multipleAssignment } = useCashierStore();
  const [posPane, setPosPane] = useState('register');
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const { open: shiftModalOpen, openShift: openShiftModal } = useCashierShiftModal();

  const cart = usePosCartStoreBindings();
  const { viewMode, handleViewModeChange } = usePosCatalogViewMode();
  const catalog = usePosProductsCatalog({ storeId });

  const nav = usePosNavigation({
    posPane,
    setPosPane,
    payOpen: false,
    setPayOpen: () => {},
    searchActive: catalog.searchActive,
    viewMode,
    handleViewModeChange,
    catalogBrowse: catalog.catalogBrowse,
    setCatalogBrowse: catalog.setCatalogBrowse,
    setSelectedCategoryId: catalog.setSelectedCategoryId,
    setSearch: catalog.setSearch,
  });

  const {
    payOpen,
    setPayOpen,
    payFlowOptions,
    handleClosePayment,
    handleOpenPaymentFlow,
    handlePayFlowClosed,
  } = usePosPaymentFlow(nav.handleClosePayment, setPosPane);

  const { shift, shiftIsOpen, shiftFetched, shiftFetching, shiftQueryError } = useCashierShiftView(storeId);

  const total = cart.getTotal();
  const linesTotal = cart.getLinesTotal();
  const orderDiscount = cart.getOrderDiscount();

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
    addPieceItem: cart.addPieceItem,
    addWeightLine: cart.addWeightLine,
    updateQuantity: cart.updateQuantity,
    updateUnitPrice: cart.updateUnitPrice,
    removeItem: cart.removeItem,
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

  usePosPageEffects({
    storeId,
    shiftFetched,
    shiftFetching,
    shift,
    shiftQueryError,
    openShiftModal,
    handleGoToCatalog: nav.handleGoToCatalog,
    handleGoToRegister: nav.handleGoToRegister,
    searchInputRef,
    returnOpen,
    payOpen,
  });

  const catalogProps = buildPosCatalogProps(catalog, cartHandlers, {
    storeId,
    viewMode,
    handleViewModeChange,
  });

  const handleReturnSuccess = () => {
    qc.invalidateQueries({ queryKey: ['sales-ledger'] });
    qc.invalidateQueries({ queryKey: ['my-sales'] });
    qc.invalidateQueries({ queryKey: ['cashier-shift'] });
  };

  const cartActions = usePosCartActions({
    items: cart.items,
    holdCart: cart.holdCart,
    restoreParkedCart: cart.restoreParkedCart,
    removeParkedCart: cart.removeParkedCart,
    clearParkedCarts: cart.clearParkedCarts,
    parkedCarts: cart.parkedCarts,
    clearCart: cart.clearCart,
    setSelectedLineId,
    setDiscountOpen,
    setCustomer: cart.setCustomer,
    discountOpen,
    payOpen,
    returnOpen,
    t,
  });

  usePosHotkeys({
    posPane,
    handleGoToRegister: nav.handleGoToRegister,
    handleHoldCart: cartActions.handleHoldCart,
    searchInputRef,
  });

  const cashMovement = useCashierCashMovement({ shiftIsOpen, storeId, t });

  return {
    t,
    storeId,
    storeBlocked: noAssignment || multipleAssignment,
    noAssignment,
    searchInputRef,
    posPane,
    payOpen,
    returnOpen,
    setReturnOpen,
    discountOpen,
    setDiscountOpen,
    shift,
    selectedLineId,
    setSelectedLineId,
    catalogProps,
    handleClosePayment,
    items: cart.items,
    total,
    linesTotal,
    orderDiscount,
    updateQuantity: cart.updateQuantity,
    updateUnitPrice: cart.updateUnitPrice,
    removeItem: cart.removeItem,
    cartHandlers,
    checkoutMutation,
    handleConfirmPayment,
    shiftIsOpen,
    handleReturnSuccess,
    ...cartActions,
    ...cashMovement,
    hasParkedCart: cart.hasParkedCart,
    parkedCarts: cart.parkedCarts,
    checkNo: cart.checkNo,
    customerId: cart.customerId,
    customerName: cart.customerName,
    handleOpenPaymentFlow,
    handlePayFlowClosed,
    payFlowOptions,
    setOrderDiscountAmount: cart.setOrderDiscountAmount,
    setOrderDiscountPercent: cart.setOrderDiscountPercent,
    clearOrderDiscount: cart.clearOrderDiscount,
  };
}
