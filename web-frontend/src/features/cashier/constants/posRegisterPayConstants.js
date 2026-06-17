/** Кнопки способов оплаты и провайдеров на боковой панели кассы. */

import { Coins, QrCode, Wallet } from 'lucide-react';
import { PAYMENT_PROVIDER_LOGOS } from './paymentProviderLogos';

export const REGISTER_PAY_METHODS = [
  { id: 'cashless', labelKey: 'pos.payCashlessRail', action: 'cashless', icon: QrCode },
  { id: 'credit', labelKey: 'pos.payCreditRail', action: 'credit', icon: Wallet },
  { id: 'advance', labelKey: 'pos.payAdvanceRail', action: 'advance', icon: Coins },
];

export const REGISTER_CARD_PROVIDERS = [
  {
    id: 'PAYME',
    labelKey: 'pos.cardPayme',
    enabled: false,
    tone: 'payme',
    logoSrc: PAYMENT_PROVIDER_LOGOS.PAYME,
  },
  {
    id: 'HUMO',
    labelKey: 'pos.cardHumo',
    enabled: true,
    cardType: 'HUMO',
    tone: 'humo',
    logoSrc: PAYMENT_PROVIDER_LOGOS.HUMO,
  },
  {
    id: 'UZCARD',
    labelKey: 'pos.cardUzcard',
    enabled: true,
    cardType: 'UZCARD',
    tone: 'uzcard',
    logoSrc: PAYMENT_PROVIDER_LOGOS.UZCARD,
  },
  {
    id: 'CLICK',
    labelKey: 'pos.cardClick',
    enabled: false,
    tone: 'click',
    logoSrc: PAYMENT_PROVIDER_LOGOS.CLICK,
  },
];
