/** Кнопки способов оплаты и провайдеров на боковой панели кассы. */

import { Coins, QrCode, Split, Wallet } from 'lucide-react';
import { PAYMENT_PROVIDER_LOGOS } from './paymentProviderLogos';

export const REGISTER_PAY_METHODS = [
  { id: 'cashless', labelKey: 'pos.payCashlessRail', action: 'cashless', icon: QrCode },
  { id: 'mixed', labelKey: 'pos.payMixedRail', action: 'mixed', icon: Split },
  { id: 'credit', labelKey: 'pos.payCreditRail', action: 'credit', icon: Wallet },
  { id: 'advance', labelKey: 'pos.payAdvanceRail', action: 'advance', icon: Coins },
];

export const REGISTER_CARD_PROVIDERS = [
  {
    id: 'UZUM',
    labelKey: 'pos.cardUzum',
    enabled: false,
    tone: 'uzum',
    logoSrc: PAYMENT_PROVIDER_LOGOS.UZUM,
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
    id: 'CLIC',
    labelKey: 'pos.cardClic',
    enabled: false,
    tone: 'clic',
    logoSrc: PAYMENT_PROVIDER_LOGOS.CLIC,
  },
];
