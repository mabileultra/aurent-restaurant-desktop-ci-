import { describe, it, expect, vi } from 'vitest';
import {
  calculateCashPaymentState,
  resolvePaymentStepTitle,
  resolvePaymentStepFlags,
  resolvePaymentStepBack,
  withCreditCustomer,
  withAdvancePayment,
} from './posPaymentFlowHelpers';

describe('posPaymentFlowHelpers', () => {
  const mockT = (key) => key;

  describe('calculateCashPaymentState', () => {
    it('calculates change when enough cash tendered', () => {
      const res = calculateCashPaymentState('150000', 100000);
      expect(res.tenderedNum).toBe(150000);
      expect(res.changeDue).toBe(50000);
      expect(res.cashPaidEnough).toBe(true);
      expect(res.cashShortfall).toBe(0);
    });

    it('calculates shortfall when not enough tendered', () => {
      const res = calculateCashPaymentState('80000', 100000);
      expect(res.changeDue).toBe(0);
      expect(res.cashPaidEnough).toBe(false);
      expect(res.cashShortfall).toBe(20000);
    });
  });

  describe('resolvePaymentStepTitle', () => {
    it('returns appropriate title for steps', () => {
      expect(resolvePaymentStepTitle({ step: 'cash', payMethod: 'cash', t: mockT })).toBe('pos.payCash');
      expect(resolvePaymentStepTitle({ step: 'cardType', payMethod: 'card', t: mockT })).toBe('pos.cardTypeTitle');
      expect(resolvePaymentStepTitle({ step: 'creditCustomer', payMethod: 'advance', t: mockT })).toBe('pos.advanceCustomerTitle');
      expect(resolvePaymentStepTitle({ step: 'creditCustomer', payMethod: 'credit', t: mockT })).toBe('pos.creditCustomerTitle');
    });
  });

  describe('resolvePaymentStepFlags', () => {
    it('returns flags according to step', () => {
      const flags = resolvePaymentStepFlags({ step: 'cash', checkTotal: 100, effectiveToPay: 80 });
      expect(flags.headerPayAmount).toBe(80);
      expect(flags.showHeaderAmount).toBe(true);
      expect(flags.showRegisterBackToCheck).toBe(true);
      expect(flags.showFooterPrimary).toBe(true);
    });
  });

  describe('withCreditCustomer and withAdvancePayment', () => {
    it('decorates payment with credit customer if CREDIT', () => {
      const p = withCreditCustomer({ amount: 100 }, { receiptType: 'CREDIT', selectedId: 'C1', selectedName: 'Ali' });
      expect(p.customerId).toBe('C1');
      expect(p.customerName).toBe('Ali');
    });

    it('decorates payment with advance amount if used > 0', () => {
      const p = withAdvancePayment({ amount: 100 }, { receiptType: 'SALE', selectedId: 'C1', selectedName: 'Ali', advanceAmountUsed: 50 });
      expect(p.advanceAmount).toBe(50);
      expect(p.customerId).toBe('C1');
    });
  });
});
