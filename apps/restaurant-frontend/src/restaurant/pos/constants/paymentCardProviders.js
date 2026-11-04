export const PAYMENT_PROVIDER_LOGOS = {
  PAYME: '/cashier/payment-providers/payme.svg',
  HUMO: '/cashier/payment-providers/humo.png',
  UZCARD: '/cashier/payment-providers/uzcard.png',
  CLICK: '/cashier/payment-providers/click.svg',
};

/** Card / QR rails on restaurant pay modal (CARD + MIXED). */
export const PAYMENT_CARD_PROVIDERS = [
  {
    id: 'HUMO',
    labelKey: 'pos.cardHumo',
    cardType: 'HUMO',
    tone: 'humo',
    logoSrc: PAYMENT_PROVIDER_LOGOS.HUMO,
  },
  {
    id: 'UZCARD',
    labelKey: 'pos.cardUzcard',
    cardType: 'UZCARD',
    tone: 'uzcard',
    logoSrc: PAYMENT_PROVIDER_LOGOS.UZCARD,
  },
  {
    id: 'PAYME',
    labelKey: 'pos.cardPayme',
    cardType: 'PAYME',
    tone: 'payme',
    logoSrc: PAYMENT_PROVIDER_LOGOS.PAYME,
  },
  {
    id: 'CLICK',
    labelKey: 'pos.cardClick',
    cardType: 'CLICK',
    tone: 'click',
    logoSrc: PAYMENT_PROVIDER_LOGOS.CLICK,
  },
];
