/** Кнопки способов оплаты и провайдеров на боковой панели кассы. */

import { QrCode, Shield, Wallet } from 'lucide-react';
import { PAYMENT_CARD_PROVIDERS } from './paymentCardProviders';

export const REGISTER_PAY_METHODS = [
  { id: 'cashless', labelKey: 'pos.payCashlessRail', action: 'cashless', icon: QrCode },
  { id: 'credit', labelKey: 'pos.payCreditRail', action: 'credit', icon: Wallet },
  { id: 'advance', labelKey: 'pos.payAdvanceRail', action: 'advance', icon: Shield },
];

export const REGISTER_CARD_PROVIDERS = PAYMENT_CARD_PROVIDERS;
