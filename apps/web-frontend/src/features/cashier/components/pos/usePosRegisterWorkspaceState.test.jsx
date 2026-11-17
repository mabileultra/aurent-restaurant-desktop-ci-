// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePosRegisterWorkspaceState } from './usePosRegisterWorkspaceState';

describe('usePosRegisterWorkspaceState', () => {
  const createMockCatalog = () => ({
    storeId: 1,
    search: '',
    setSearch: vi.fn(),
    handleSearchEnter: vi.fn(),
    categories: [],
    categoriesLoading: false,
    selectedCategoryId: null,
    handleSelectCategory: vi.fn(),
    setSelectedCategoryId: vi.fn(),
    searchActive: false,
    catalogBrowse: 'categories',
    setCatalogBrowse: vi.fn(),
    products: [],
    productsLoading: false,
    productsError: null,
    productsLoadingMore: false,
    productsHasMore: false,
    fetchMoreProducts: vi.fn(),
    addProductToCart: vi.fn(),
    viewMode: 'grid',
    handleViewModeChange: vi.fn(),
  });

  const createMockCart = () => ({
    items: [],
    total: 0,
    checkNo: '1001',
    customerId: null,
    customerName: '',
    onSetCustomer: vi.fn(),
  });

  const createMockCheckout = () => ({
    checkoutMutation: { isPending: false },
    handleConfirmPayment: vi.fn(),
  });

  it('initializes workspace state correctly for register pane', () => {
    const catalog = createMockCatalog();
    const cart = createMockCart();
    const checkout = createMockCheckout();

    const { result } = renderHook(() =>
      usePosRegisterWorkspaceState({
        posPane: 'register',
        catalog,
        cart,
        checkout,
        payOpen: false,
        onClosePayment: vi.fn(),
        shiftIsOpen: true,
        onReturn: vi.fn(),
        onDiscount: vi.fn(),
        onCashIn: vi.fn(),
        onCashOut: vi.fn(),
        onOpenPaymentFlow: vi.fn(),
      })
    );

    expect(result.current.showRegisterFinder).toBe(true);
    expect(result.current.registerFinder).not.toBeNull();
    expect(result.current.payProps.checkoutDisabled).toBe(true); // because items.length === 0
  });

  it('manages customer card modal open state', () => {
    const catalog = createMockCatalog();
    const cart = createMockCart();
    const checkout = createMockCheckout();

    const { result } = renderHook(() =>
      usePosRegisterWorkspaceState({
        posPane: 'register',
        catalog,
        cart,
        checkout,
        payOpen: false,
        onClosePayment: vi.fn(),
        shiftIsOpen: true,
      })
    );

    expect(result.current.customerCardOpen).toBe(false);

    act(() => {
      result.current.setCustomerCardOpen(true);
    });

    expect(result.current.customerCardOpen).toBe(true);
  });
});
