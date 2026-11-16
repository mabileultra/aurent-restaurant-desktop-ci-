// @vitest-environment jsdom
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/services/pos/posDataRouter', () => ({ posCreateSale: vi.fn() }));
vi.mock('../../../src/services/cashierEscpos', () => ({
  isCashierEscposPrintAvailable: () => false,
  printFiscalReceipt: vi.fn(),
  resolveEscposPrintErrorMessage: vi.fn(),
}));
vi.mock('../../../src/features/marking', () => ({
  collectMarksFromCartItems: vi.fn(() => []),
  rememberSoldMarks: vi.fn(),
}));

import { posCreateSale } from '../../../src/services/pos/posDataRouter';
import { useCartStore } from '../../../src/store/cartStore';
import { usePosCheckout } from '../../../src/features/cashier/hooks/pos/usePosCheckout';
import {
  usePrescriptionCheckoutGate,
  usePrescriptionGateStore,
} from '../../../src/features/cashier/hooks/pos/usePrescriptionCheckoutGate';

const RX_PRODUCT = {
  id: 10,
  name: 'Amoksitsillin',
  sellingPrice: 12000,
  stockQuantity: 5,
  attributes: { prescription_required: 'true' },
};
const PLAIN_PRODUCT = { id: 11, name: 'Vitamin C', sellingPrice: 5000, stockQuantity: 5 };
const VALID_NUMBER = 'RX-2026/0042';

function renderCheckout() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(
    () => ({
      checkout: usePosCheckout({
        storeId: 7,
        total: 12000,
        setPayOpen: vi.fn(),
        setSelectedLineId: vi.fn(),
      }),
      gate: usePrescriptionCheckoutGate(),
    }),
    { wrapper },
  );
}

async function flushMutation() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('checkout chokepoint: electronic prescription number (AUR-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePrescriptionGateStore.setState({ isOpen: false, pendingAction: null });
    useCartStore.setState({ parkedCarts: [] });
    useCartStore.getState().clearCart();
    posCreateSale.mockResolvedValue({ data: { id: 1, receiptNumber: 'CHK-1' } });
  });

  it.each([
    ['cash / Enter / F12 hotkey', { paymentMethod: 'CASH', receiptType: 'SALE', amountTendered: 12000 }],
    ['card', { paymentMethod: 'CARD', receiptType: 'SALE', cardType: 'HUMO', amountTendered: 12000 }],
    ['mixed', { paymentMethod: 'MIXED', receiptType: 'SALE', cashAmount: 2000, cardAmount: 10000 }],
    ['credit (nasiya)', { paymentMethod: 'CASH', receiptType: 'CREDIT', customerId: 5 }],
    ['advance', { paymentMethod: 'CASH', receiptType: 'ADVANCE', customerId: 5 }],
  ])('%s: blocked without a number, the modal opens, the sale resumes after confirm', async (_label, payment) => {
    useCartStore.getState().addPieceItem(RX_PRODUCT);
    const { result } = renderCheckout();

    act(() => result.current.checkout.handleConfirmPayment(payment));
    await flushMutation();

    expect(posCreateSale).not.toHaveBeenCalled();
    expect(result.current.gate.isOpen).toBe(true);

    act(() => {
      result.current.gate.confirm(VALID_NUMBER);
    });
    await flushMutation();

    expect(result.current.gate.isOpen).toBe(false);
    expect(posCreateSale).toHaveBeenCalledTimes(1);
    expect(posCreateSale.mock.calls[0][0].payment).toMatchObject({
      paymentMethod: payment.paymentMethod,
      receiptType: payment.receiptType,
      prescriptionNumber: VALID_NUMBER,
    });
  });

  it('rejects a number in the wrong format and keeps the sale blocked', async () => {
    useCartStore.getState().addPieceItem(RX_PRODUCT);
    const { result } = renderCheckout();

    act(() => result.current.checkout.handleConfirmPayment({ paymentMethod: 'CASH', receiptType: 'SALE' }));
    let validation = null;
    act(() => {
      validation = result.current.gate.confirm('ab 1');
    });
    await flushMutation();

    expect(validation).toEqual({ ok: false, issue: 'invalid' });
    expect(result.current.gate.isOpen).toBe(true);
    expect(posCreateSale).not.toHaveBeenCalled();
  });

  it('closing the modal cancels the interrupted sale', async () => {
    useCartStore.getState().addPieceItem(RX_PRODUCT);
    const { result } = renderCheckout();

    act(() => result.current.checkout.handleConfirmPayment({ paymentMethod: 'CASH', receiptType: 'SALE' }));
    act(() => result.current.gate.close());
    await flushMutation();

    expect(result.current.gate.isOpen).toBe(false);
    expect(posCreateSale).not.toHaveBeenCalled();
  });

  it('a cart without prescription drugs is sold without the modal', async () => {
    useCartStore.getState().addPieceItem(PLAIN_PRODUCT);
    const { result } = renderCheckout();

    act(() => result.current.checkout.handleConfirmPayment({ paymentMethod: 'CASH', receiptType: 'SALE' }));
    await flushMutation();

    expect(result.current.gate.isOpen).toBe(false);
    expect(posCreateSale).toHaveBeenCalledTimes(1);
    expect(posCreateSale.mock.calls[0][0].payment).not.toHaveProperty('prescriptionNumber');
  });

  it('a refund payment never opens the modal', () => {
    useCartStore.getState().addPieceItem(RX_PRODUCT);
    const { result } = renderCheckout();

    let ready = false;
    act(() => {
      ready = result.current.gate.ensurePrescriptionReady(() => {}, { receiptType: 'RETURN' });
    });

    expect(ready).toBe(true);
    expect(result.current.gate.isOpen).toBe(false);
  });
});
