import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ENABLED_PAYMENT_CARD_PROVIDERS } from '../../cashier/constants/paymentCardProviders';
import { usePharmacyPayRail } from '../hooks/usePharmacyPayRail';
import {
  PHARMACY_SALE_SUBMIT_ACTION,
  resolvePharmacySaleSubmitAction,
} from './resolvePharmacySaleSubmitAction';

const DEFAULT_CARD_TYPE = ENABLED_PAYMENT_CARD_PROVIDERS[0].cardType;

/** Состояние рейла на первом рендере — до того, как кассир нажал кнопку карты. */
function readInitialRail() {
  let rail = null;
  function Probe() {
    rail = usePharmacyPayRail({
      total: 50000,
      checkoutDisabled: false,
      isPending: false,
      onConfirm: () => {},
    });
    return null;
  }
  renderToStaticMarkup(React.createElement(Probe));
  return rail;
}

describe('resolvePharmacySaleSubmitAction', () => {
  it('F12 in card method opens the card details modal', () => {
    expect(
      resolvePharmacySaleSubmitAction({ method: 'card', hasPartialCash: false, cardType: 'HUMO' }),
    ).toEqual({ kind: PHARMACY_SALE_SUBMIT_ACTION.CARD_MODAL, cardType: 'HUMO' });
  });

  it('F12 in mixed method with a card remainder opens the card details modal', () => {
    expect(
      resolvePharmacySaleSubmitAction({ method: 'mixed', hasPartialCash: true, cardType: 'UZCARD' }),
    ).toEqual({ kind: PHARMACY_SALE_SUBMIT_ACTION.CARD_MODAL, cardType: 'UZCARD' });
  });

  it('F12 in cash method with a card remainder opens the card details modal', () => {
    expect(
      resolvePharmacySaleSubmitAction({ method: 'cash', hasPartialCash: true, cardType: 'UZCARD' }),
    ).toEqual({ kind: PHARMACY_SALE_SUBMIT_ACTION.CARD_MODAL, cardType: 'UZCARD' });
  });

  it('F12 submits directly for full cash, cashless and mixed without a remainder', () => {
    const submit = { kind: PHARMACY_SALE_SUBMIT_ACTION.SUBMIT };
    expect(resolvePharmacySaleSubmitAction({ method: 'cash', hasPartialCash: false, cardType: 'HUMO' })).toEqual(submit);
    expect(resolvePharmacySaleSubmitAction({ method: 'cashless', hasPartialCash: false, cardType: 'HUMO' })).toEqual(submit);
    expect(resolvePharmacySaleSubmitAction({ method: 'mixed', hasPartialCash: false, cardType: 'HUMO' })).toEqual(submit);
  });
});

describe('usePharmacyPayRail: card type for the F12 card modal', () => {
  it('exposes a resolved cardType before any card button was pressed', () => {
    const rail = readInitialRail();
    // Регрессия AUR-2: PayStack читал rail.cardType, которого не было в возврате хука.
    expect(rail.selectedCardType).toBeNull();
    expect(rail.cardType).toBe(DEFAULT_CARD_TYPE);
    expect(
      resolvePharmacySaleSubmitAction({ method: 'card', hasPartialCash: false, cardType: rail.cardType }),
    ).toEqual({ kind: PHARMACY_SALE_SUBMIT_ACTION.CARD_MODAL, cardType: DEFAULT_CARD_TYPE });
  });
});
