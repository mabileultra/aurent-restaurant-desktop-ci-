import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { restaurantApi } from '../../../api/restaurant.api';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShift } from '../../../hooks/useCashierShift';
import { useCashierShiftModal } from '../../../contexts/CashierShiftModalContext';
import { usePosProductsCatalog } from '../../cashier/hooks/pos/usePosProductsCatalog';
import { usePosCatalogViewMode } from '../../cashier/hooks/pos/usePosCatalogViewMode';
import { useRestaurantNavigation } from './useRestaurantNavigation';
import { clampPayAmount, round2 } from '../../../utils/taxAmounts';
import { isMeasuredProduct } from '../../../utils/quantityFormat';
import { resolveProductUnitPrice } from '../../../utils/productPrice';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { CASHIER_ESCPOS_TOAST } from '../../../config/cashierEscposConfig';

export function useRestaurantPosPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const searchInputRef = useRef(null);
  const { storeId, noAssignment, multipleAssignment } = useCashierStore();
  const [restaurantPane, setRestaurantPane] = useState('tables');
  const [selectedHallId, setSelectedHallId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [checkOpen, setCheckOpen] = useState(false);
  const [openTableModal, setOpenTableModal] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payFlowOptions, setPayFlowOptions] = useState(null);
  const [payFlowSession, setPayFlowSession] = useState(0);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [orderDiscountAmount, setOrderDiscountAmount] = useState(0);
  const [orderDiscountPercent, setOrderDiscountPercent] = useState(null);
  const [weightModalProduct, setWeightModalProduct] = useState(null);
  const [sendingKitchenDepartment, setSendingKitchenDepartment] = useState(null);
  const { open: shiftModalOpen, openShift: openShiftModal } = useCashierShiftModal();
  const shiftAutoPromptedRef = useRef(false);

  const floorQuery = useQuery({
    queryKey: ['restaurant-hall', storeId],
    queryFn: () => restaurantApi.getFloorSnapshot(storeId).then((r) => r.data),
    enabled: !!storeId,
    refetchInterval: 30_000,
  });

  const halls = floorQuery.data?.halls ?? [];
  const selectedHall = halls.find((h) => h.id === selectedHallId) ?? halls[0] ?? null;

  useEffect(() => {
    if (selectedHall && selectedHallId !== selectedHall.id) {
      setSelectedHallId(selectedHall.id);
    }
  }, [selectedHall, selectedHallId]);

  const sessionQuery = useQuery({
    queryKey: ['restaurant-session', sessionId],
    queryFn: () => restaurantApi.getSession(sessionId).then((r) => r.data),
    enabled: !!sessionId,
  });

  const session = sessionQuery.data ?? null;
  const linesTotal = session?.subtotal ?? 0;
  const orderDiscount = round2(Math.min(linesTotal, Math.max(0, orderDiscountAmount)));
  const total = round2(Math.max(0, linesTotal - orderDiscount));

  useEffect(() => {
    setOrderDiscountAmount(0);
    setOrderDiscountPercent(null);
    setSelectedLineId(null);
  }, [sessionId]);

  const invalidateFloor = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['restaurant-hall', storeId] });
    return qc.refetchQueries({ queryKey: ['restaurant-hall', storeId] });
  }, [qc, storeId]);

  const openSessionMutation = useMutation({
    mutationFn: ({ tableId, guestCount }) => restaurantApi.openSession(tableId, { guestCount }),
    onSuccess: (res) => {
      setSessionId(res.data.id);
      setCheckOpen(true);
      setOpenTableModal(false);
      invalidateFloor();
      toast.success(t('restaurantCashier.tableOpened'));
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantCashier.openFailed')),
  });

  const addLineMutation = useMutation({
    mutationFn: ({ productId, quantity }) => restaurantApi.addLine(sessionId, { productId, quantity }),
    onSuccess: (res) => {
      qc.setQueryData(['restaurant-session', sessionId], res.data);
      invalidateFloor();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantCashier.addLineFailed')),
  });

  const sendToKitchenMutation = useMutation({
    mutationFn: ({ department } = {}) => restaurantApi.sendToKitchen(sessionId, department),
    onMutate: ({ department } = {}) => {
      setSendingKitchenDepartment(department ?? 'ALL');
    },
    onSuccess: (res) => {
      qc.setQueryData(['restaurant-session', sessionId], res.data);
      toast.success(t('restaurantCashier.sentToKitchen'));
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('restaurantCashier.sendToKitchenFailed'));
    },
    onSettled: () => {
      setSendingKitchenDepartment(null);
    },
  });

  const kitchenDepartmentsQuery = useQuery({
    queryKey: ['kitchen-departments'],
    queryFn: () => restaurantApi.listKitchenDepartments().then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const removeLineMutation = useMutation({
    mutationFn: (lineId) => restaurantApi.removeLine(sessionId, lineId),
    onSuccess: (res) => {
      qc.setQueryData(['restaurant-session', sessionId], res.data);
      invalidateFloor();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantCashier.removeLineFailed')),
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ lineId, quantity }) => restaurantApi.updateLine(sessionId, lineId, { quantity }),
    onSuccess: (res) => {
      qc.setQueryData(['restaurant-session', sessionId], res.data);
      invalidateFloor();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantCashier.updateLineFailed')),
  });

  const checkoutMutation = useMutation({
    mutationFn: (payment) => restaurantApi.checkout(sessionId, {
      paymentMethod: payment.paymentMethod,
      cashAmount: payment.cashAmount,
      cardAmount: payment.cardAmount,
      amountTendered: payment.amountTendered,
      notes: payment.notes ?? `Стол ${session?.tableCode ?? ''}`,
      customerId: payment.customerId,
      receiptType: payment.receiptType,
      cardType: payment.cardType,
      orderDiscountAmount: payment.orderDiscountAmount ?? orderDiscount,
      orderDiscountPercent: payment.orderDiscountPercent ?? orderDiscountPercent,
      advanceAmount: payment.advanceAmount,
    }),
    onSuccess: async (res, payment) => {
      const sale = res.data;
      setPayOpen(false);
      setPayFlowOptions(null);
      setCheckOpen(false);
      setSessionId(null);
      setSelectedTable(null);
      setOrderDiscountAmount(0);
      setOrderDiscountPercent(null);
      setRestaurantPane('tables');
      await invalidateFloor();
      qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      toast.success(t('pos.saleSuccess'));
      const shouldPrint = payment?.printReceipt !== false;
      if (shouldPrint && isCashierEscposPrintAvailable()) {
        try {
          await printFiscalReceipt({ sale, t });
          toast.success(t('receipt.printSent'), {
            id: CASHIER_ESCPOS_TOAST.toastId,
            duration: CASHIER_ESCPOS_TOAST.successDurationMs,
          });
        } catch (err) {
          toast.error(resolveEscposPrintErrorMessage(err, t), {
            id: CASHIER_ESCPOS_TOAST.toastId,
            duration: CASHIER_ESCPOS_TOAST.errorDurationMs,
          });
        }
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message ?? err.message ?? t('pos.saleFailed');
      toast.error(msg, { id: 'restaurant-checkout-error' });
    },
  });

  const handleTableClick = (table) => {
    setSelectedTable(table);
    if (table.status === 'RESERVED') {
      toast.error(t('restaurantCashier.tableReserved'));
      return;
    }
    if (table.status === 'OCCUPIED' && table.activeSession?.id) {
      setSessionId(table.activeSession.id);
      setCheckOpen(true);
      setPayOpen(false);
      setPayFlowOptions(null);
      return;
    }
    if (table.status === 'FREE') {
      setCheckOpen(false);
      setPayOpen(false);
      setPayFlowOptions(null);
      setSessionId(null);
      setOpenTableModal(true);
    }
  };

  const handleCloseCheck = useCallback(() => {
    setCheckOpen(false);
    setPayOpen(false);
    setPayFlowOptions(null);
    setSelectedLineId(null);
  }, []);

  const handleOpenTable = (guestCount) => {
    if (!selectedTable) return;
    openSessionMutation.mutate({ tableId: selectedTable.id, guestCount });
  };

  const { viewMode, handleViewModeChange } = usePosCatalogViewMode();
  const catalog = usePosProductsCatalog({ storeId });

  const handleClosePayment = useCallback(() => {
    setPayOpen(false);
  }, []);

  const handlePayFlowClosed = useCallback(() => {
    setPayFlowOptions(null);
  }, []);

  const { handleGoToCatalog, handleGoToTables } = useRestaurantNavigation({
    restaurantPane,
    setRestaurantPane,
    payOpen,
    setPayOpen,
    onClosePayment: handleClosePayment,
    searchActive: catalog.searchActive,
    viewMode,
    handleViewModeChange,
    catalogBrowse: catalog.catalogBrowse,
    setCatalogBrowse: catalog.setCatalogBrowse,
    setSelectedCategoryId: catalog.setSelectedCategoryId,
    setSearch: catalog.setSearch,
  });

  useEffect(() => {
    if (location.state?.pane === 'catalog') {
      handleGoToCatalog();
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    if (location.state?.pane === 'tables') {
      handleGoToTables();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state?.pane, handleGoToCatalog, handleGoToTables, navigate]);

  useEffect(() => {
    if (restaurantPane === 'catalog' && storeId) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [restaurantPane, storeId, payOpen]);

  const { data: shift, isFetched: shiftFetched } = useCashierShift(storeId);
  const shiftIsOpen = shift?.status === 'OPEN';

  const addProductToSession = useCallback((product) => {
    if (!sessionId) {
      toast.error(t('restaurantCashier.selectTableFirst'));
      return;
    }
    if (!shiftIsOpen) {
      toast.error(t('pos.shiftRequired'));
      openShiftModal();
      return;
    }
    if (!product.active) {
      toast.error(t('pos.productInactive'));
      return;
    }
    if (product.saleType !== 'SERVICE' && Number(product.stockQuantity) <= 0) {
      toast.error(t('pos.outOfStock'));
      return;
    }
    if (isMeasuredProduct(product)) {
      setWeightModalProduct({
        ...product,
        sellingPrice: resolveProductUnitPrice(product, storeId),
      });
      return;
    }
    addLineMutation.mutate({ productId: product.id, quantity: 1 });
    toast.success(t('pos.itemAdded', { name: product.name, sum: '' }));
  }, [sessionId, shiftIsOpen, storeId, addLineMutation, openShiftModal, t]);

  const handleWeightConfirm = useCallback((qty) => {
    const product = weightModalProduct;
    if (!product || !sessionId) return;
    addLineMutation.mutate({ productId: product.id, quantity: qty });
    setWeightModalProduct(null);
    toast.success(t('pos.itemAdded', { name: product.name, sum: '' }));
  }, [weightModalProduct, sessionId, addLineMutation, t]);

  useEffect(() => {
    if (!storeId || !shiftFetched || shiftIsOpen || shiftAutoPromptedRef.current) return;
    shiftAutoPromptedRef.current = true;
    openShiftModal();
  }, [storeId, shiftFetched, shiftIsOpen, openShiftModal]);

  const handleOpenPaymentFlow = (options) => {
    if (!options?.step) return;
    if (!session?.lines?.length) {
      toast.error(t('restaurantCashier.emptySession'));
      return;
    }
    if (!shiftIsOpen) {
      toast.error(t('pos.shiftRequired'));
      openShiftModal();
      return;
    }
    setRestaurantPane('tables');
    setPayFlowOptions(options);
    setPayFlowSession((s) => s + 1);
    setPayOpen(true);
  };

  const handleQtyDelta = useCallback((lineId, delta) => {
    const line = session?.lines?.find((l) => l.id === lineId);
    if (!line) return;
    const next = Math.max(0.001, Number(line.quantity) + delta);
    updateLineMutation.mutate({ lineId, quantity: next });
  }, [session?.lines, updateLineMutation]);

  const handleUpdateQuantity = useCallback((lineId, quantity) => {
    updateLineMutation.mutate({ lineId, quantity });
  }, [updateLineMutation]);

  const handleReturn = useCallback(() => {}, []);

  const handleConfirmPayment = (payment) => {
    if (checkoutMutation.isPending) return;
    if ((payment.receiptType === 'CREDIT' || payment.receiptType === 'ADVANCE') && !payment.customerId) {
      toast.error(
        payment.receiptType === 'ADVANCE'
          ? t('pos.advanceCustomerRequired')
          : t('pos.creditCustomerRequired'),
      );
      return;
    }
    const payTotal = round2(total);
    const payload = {
      ...payment,
      orderDiscountAmount: orderDiscount,
      orderDiscountPercent,
    };
    if (payment.paymentMethod === 'MIXED' && payment.cashAmount != null) {
      const cash = clampPayAmount(payment.cashAmount, payTotal);
      const card = round2(Math.max(0, payTotal - cash));
      checkoutMutation.mutate({
        ...payload,
        cashAmount: cash,
        cardAmount: card,
        amountTendered: payment.amountTendered ?? cash,
      });
      return;
    }
    checkoutMutation.mutate(payload);
  };

  const handleApplyOrderDiscountAmount = useCallback((amount) => {
    setOrderDiscountAmount(round2(Math.max(0, amount)));
    setOrderDiscountPercent(null);
    setDiscountOpen(false);
  }, []);

  const handleApplyOrderDiscountPercent = useCallback((percent) => {
    const pct = Math.max(0, Math.min(100, percent));
    setOrderDiscountPercent(pct);
    setOrderDiscountAmount(round2(linesTotal * (pct / 100)));
    setDiscountOpen(false);
  }, [linesTotal]);

  const clearOrderDiscount = useCallback(() => {
    setOrderDiscountAmount(0);
    setOrderDiscountPercent(null);
    setDiscountOpen(false);
  }, []);

  const catalogProps = useMemo(() => ({
    ...catalog,
    addProductToCart: addProductToSession,
    viewMode,
    handleViewModeChange,
  }), [catalog, addProductToSession, viewMode, handleViewModeChange]);

  return {
    t,
    storeId,
    storeBlocked: noAssignment || multipleAssignment,
    noAssignment,
    multipleAssignment,
    restaurantPane,
    floorQuery,
    halls,
    selectedHall,
    setSelectedHallId,
    selectedTable,
    session,
    checkOpen,
    activeTableId: session?.tableId ?? selectedTable?.id ?? null,
    handleCloseCheck,
    sessionLoading: sessionQuery.isFetching,
    openTableModal,
    setOpenTableModal,
    handleTableClick,
    handleOpenTable,
    openSessionMutation,
    removeLineMutation,
    updateLineMutation,
    searchInputRef,
    catalogProps,
    payOpen,
    setPayOpen,
    handleClosePayment,
    handlePayFlowClosed,
    payFlowOptions,
    payFlowSession,
    handleOpenPaymentFlow,
    handleConfirmPayment,
    selectedLineId,
    setSelectedLineId,
    handleQtyDelta,
    handleUpdateQuantity,
    handleReturn,
    payDisabled: !shiftIsOpen || !session?.lines?.length || checkoutMutation.isPending,
    checkoutMutation,
    shiftIsOpen,
    linesTotal,
    orderDiscount,
    total,
    discountOpen,
    setDiscountOpen,
    handleApplyOrderDiscountAmount,
    handleApplyOrderDiscountPercent,
    clearOrderDiscount,
    weightModalProduct,
    setWeightModalProduct,
    handleWeightConfirm,
    addLinePending: addLineMutation.isPending,
    sendToKitchenMutation,
    handleSendToKitchen: (department) => sendToKitchenMutation.mutate({ department }),
    sendingKitchenDepartment,
    kitchenDepartments: kitchenDepartmentsQuery.data ?? [],
  };
}
