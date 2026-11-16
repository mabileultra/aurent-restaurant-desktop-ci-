export const PHARMACY_SALE_SUBMIT_ACTION = Object.freeze({
  CARD_MODAL: 'cardModal',
  SUBMIT: 'submit',
});

/**
 * Что делает «Продажа» (F12 / Enter) при текущем способе оплаты.
 * Любая оплата с картой (карта, смешанная, нал + остаток картой) сначала
 * открывает модалку реквизитов карты — RRN обязателен для чека.
 * @param {{ method: string, hasPartialCash: boolean, cardType: string | null }} state
 * @returns {{ kind: 'cardModal', cardType: string } | { kind: 'submit' }}
 */
export function resolvePharmacySaleSubmitAction({ method, hasPartialCash, cardType }) {
  const paysByCard =
    method === 'card'
    || ((method === 'cash' || method === 'mixed') && Boolean(hasPartialCash));
  if (paysByCard && cardType) {
    return { kind: PHARMACY_SALE_SUBMIT_ACTION.CARD_MODAL, cardType };
  }
  return { kind: PHARMACY_SALE_SUBMIT_ACTION.SUBMIT };
}
