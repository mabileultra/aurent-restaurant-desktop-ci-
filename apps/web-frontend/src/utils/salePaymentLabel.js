import { CARD_CATEGORY } from '@aurent/shared-types';
import { normalizeCardCategory } from '@aurent/shared-fiscal';

export function cardCategoryLabel(category, t) {
  const normalized = normalizeCardCategory(category);
  if (!normalized) return null;
  switch (normalized) {
    case CARD_CATEGORY.PERSONAL:
      return t('pos.cardPersonal', { defaultValue: 'Shaxsiy' });
    case CARD_CATEGORY.CORPORATE:
      return t('pos.cardCorporate', { defaultValue: 'Korporativ' });
    case CARD_CATEGORY.SOCIAL:
      return t('pos.cardSocial', { defaultValue: 'Ijtimoiy' });
    default:
      return null;
  }
}

export function cardTypeLabel(cardType, t) {
  if (!cardType) return null;
  switch (cardType) {
    case 'HUMO':
      return t('pos.cardHumo');
    case 'UZCARD':
      return t('pos.cardUzcard');
    case 'PAYME':
      return t('pos.cardPayme');
    case 'CLICK':
      return t('pos.cardClick');
    case 'PERSONAL':
      return t('pos.cardPersonal', { defaultValue: 'Shaxsiy' });
    case 'CORPORATE':
      return t('pos.cardCorporate', { defaultValue: 'Korporativ' });
    case 'SOCIAL':
      return t('pos.cardSocial', { defaultValue: 'Ijtimoiy' });
    default:
      return cardType;
  }
}

function deferredPaymentLabel(row, t) {
  const typeLabel = t(`pos.receiptType.${row.receiptType}`);
  if (row.customerName) {
    return `${typeLabel} · ${row.customerName}`;
  }
  return typeLabel;
}

export function salePaymentLabel(row, t) {
  if (row.receiptType === 'CREDIT' || row.receiptType === 'ADVANCE') {
    return deferredPaymentLabel(row, t);
  }
  const m = row.paymentMethod;
  if (m === 'CARD') {
    const card = cardTypeLabel(row.cardType, t);
    return card ? `${t('sales.paymentCard')} · ${card}` : t('sales.paymentCard');
  }
  if (m === 'MIXED') {
    const card = cardTypeLabel(row.cardType, t);
    return card ? `${t('salesLedger.filters.mixed')} · ${card}` : t('salesLedger.filters.mixed');
  }
  if (m === 'CASHLESS') return t('sales.paymentCashless');
  if (m === 'MPESA') return t('sales.paymentMpesa');
  if (m === 'CASH') return t('sales.paymentCash');
  return m || '—';
}
