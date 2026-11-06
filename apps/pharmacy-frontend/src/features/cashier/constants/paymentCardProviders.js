import { PAYMENT_PROVIDER_LOGOS } from './paymentProviderLogos';

/** Провайдеры карты / QR на кассе (rail и шаг выбора карты). */
export const PAYMENT_CARD_PROVIDERS = [
  {
    id: 'PAYME',
    labelKey: 'pos.cardPayme',
    cardType: 'PAYME',
    enabled: true,
    tone: 'payme',
    logoSrc: PAYMENT_PROVIDER_LOGOS.PAYME,
  },
  {
    id: 'HUMO',
    labelKey: 'pos.cardHumo',
    cardType: 'HUMO',
    enabled: true,
    tone: 'humo',
    logoSrc: PAYMENT_PROVIDER_LOGOS.HUMO,
  },
  {
    id: 'UZCARD',
    labelKey: 'pos.cardUzcard',
    cardType: 'UZCARD',
    enabled: true,
    tone: 'uzcard',
    logoSrc: PAYMENT_PROVIDER_LOGOS.UZCARD,
  },
  {
    id: 'CLICK',
    labelKey: 'pos.cardClick',
    cardType: 'CLICK',
    enabled: true,
    tone: 'click',
    logoSrc: PAYMENT_PROVIDER_LOGOS.CLICK,
  },
];

export const ENABLED_PAYMENT_CARD_PROVIDERS = PAYMENT_CARD_PROVIDERS.filter(
  (provider) => provider.enabled && provider.cardType,
);
