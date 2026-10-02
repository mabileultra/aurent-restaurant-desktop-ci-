import { describe, expect, it } from 'vitest';
import {
  buildRestaurantPayPayload,
  deriveRestaurantPay,
  isNonFiscalPayMethod,
} from '../../../../src/restaurant/pos/utils/restaurantPayForm';

const DUE = 120000;

describe('restaurantPayForm — credit', () => {
  it('blocks submit until phone is entered', () => {
    const noPhone = deriveRestaurantPay(DUE, { method: 'CREDIT', debtPhone: '' });
    expect(noPhone.canSubmit).toBe(false);
    expect(noPhone.hintKey).toBe('rst.order.debtPhoneRequired');

    const blank = deriveRestaurantPay(DUE, { method: 'CREDIT', debtPhone: '   ' });
    expect(blank.canSubmit).toBe(false);

    const ok = deriveRestaurantPay(DUE, { method: 'CREDIT', debtPhone: '+998901112233' });
    expect(ok.canSubmit).toBe(true);
    expect(ok.hintKey).toBeNull();
    expect(ok.infoKey).toBe('rst.order.payCreditHint');
  });

  it('puts the whole bill on credit with no drawer money', () => {
    const d = deriveRestaurantPay(DUE, { method: 'CREDIT', debtPhone: '+998901112233' });
    expect(d.cashAmount).toBe(0);
    expect(d.cardAmount).toBe(0);
    expect(d.debtRemaining).toBe(DUE);
    expect(d.advancePaid).toBeNull();
  });

  it('sends trimmed phone and comment, no advance', () => {
    const d = deriveRestaurantPay(DUE, { method: 'CREDIT', debtPhone: '+998901112233' });
    const payload = buildRestaurantPayPayload(d, 'CREDIT', null, {
      phone: '  +998901112233 ',
      comment: '  вернёт в пятницу ',
    });
    expect(payload).toMatchObject({
      method: 'CREDIT',
      amount: DUE,
      cashAmount: 0,
      cardAmount: 0,
      debtPhone: '+998901112233',
      debtComment: 'вернёт в пятницу',
    });
    expect(payload).not.toHaveProperty('advancePaid');
    expect(payload).not.toHaveProperty('cardType');
  });

  it('sends null comment when empty', () => {
    const d = deriveRestaurantPay(DUE, { method: 'CREDIT', debtPhone: '1' });
    const payload = buildRestaurantPayPayload(d, 'CREDIT', null, { phone: '1', comment: '   ' });
    expect(payload.debtComment).toBeNull();
  });
});

describe('restaurantPayForm — advance', () => {
  const base = { method: 'ADVANCE', debtPhone: '+998901112233' };

  it('requires a paid amount', () => {
    const d = deriveRestaurantPay(DUE, { ...base, tendered: '' });
    expect(d.canSubmit).toBe(false);
    expect(d.hintKey).toBe('rst.order.advanceRequired');
    expect(d.debtRemaining).toBe(DUE);
  });

  it('computes paid and remaining', () => {
    const d = deriveRestaurantPay(DUE, { ...base, tendered: '50000' });
    expect(d.canSubmit).toBe(true);
    expect(d.advancePaid).toBe(50000);
    expect(d.debtRemaining).toBe(70000);
    expect(d.cashAmount).toBe(0);
  });

  it('accepts comma decimals and spaces', () => {
    const d = deriveRestaurantPay(DUE, { ...base, tendered: '50 000,50' });
    expect(d.advancePaid).toBe(50000.5);
    expect(d.debtRemaining).toBe(69999.5);
  });

  it('allows paying the full bill with nothing left', () => {
    const d = deriveRestaurantPay(DUE, { ...base, tendered: String(DUE) });
    expect(d.canSubmit).toBe(true);
    expect(d.debtRemaining).toBe(0);
  });

  it('rejects advance above the bill', () => {
    const d = deriveRestaurantPay(DUE, { ...base, tendered: '120001' });
    expect(d.canSubmit).toBe(false);
    expect(d.hintKey).toBe('rst.order.advanceExceeds');
    expect(d.debtRemaining).toBe(0);
  });

  it('phone hint wins over amount hint', () => {
    const d = deriveRestaurantPay(DUE, { method: 'ADVANCE', debtPhone: '', tendered: '50000' });
    expect(d.canSubmit).toBe(false);
    expect(d.hintKey).toBe('rst.order.debtPhoneRequired');
  });

  it('payload carries advancePaid with phone and comment', () => {
    const d = deriveRestaurantPay(DUE, { ...base, tendered: '50000' });
    const payload = buildRestaurantPayPayload(d, 'ADVANCE', null, {
      phone: '+998901112233',
      comment: 'банкет',
    });
    expect(payload).toMatchObject({
      method: 'ADVANCE',
      debtPhone: '+998901112233',
      debtComment: 'банкет',
      advancePaid: 50000,
    });
  });
});

describe('restaurantPayForm — drawer methods unchanged', () => {
  it('cash payload has no debt fields', () => {
    const d = deriveRestaurantPay(DUE, { method: 'CASH', tendered: '150000' });
    expect(d.changeGiven).toBe(30000);
    const payload = buildRestaurantPayPayload(d, 'CASH', null, { phone: '+998', comment: 'x' });
    expect(payload).not.toHaveProperty('debtPhone');
    expect(payload).not.toHaveProperty('debtComment');
    expect(payload).not.toHaveProperty('advancePaid');
  });

  it('card still requires a card type', () => {
    expect(deriveRestaurantPay(DUE, { method: 'CARD' }).canSubmit).toBe(false);
    const d = deriveRestaurantPay(DUE, { method: 'CARD', cardType: 'HUMO' });
    expect(d.canSubmit).toBe(true);
    expect(buildRestaurantPayPayload(d, 'CARD', 'HUMO').cardType).toBe('HUMO');
  });

  it('only credit and advance are non-fiscal', () => {
    expect(isNonFiscalPayMethod('credit')).toBe(true);
    expect(isNonFiscalPayMethod('ADVANCE')).toBe(true);
    expect(isNonFiscalPayMethod('CASH')).toBe(false);
    expect(isNonFiscalPayMethod('MIXED')).toBe(false);
  });
});
