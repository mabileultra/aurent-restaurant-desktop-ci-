export function orderStatusLabel(t, status) {
  if (!status) return '—';
  const key = `rst.orderStatus.${status}`;
  const translated = t(key, { defaultValue: '' });
  if (translated && translated !== key) return translated;
  return status;
}

export function deliveryStatusLabel(t, status) {
  if (!status) return '—';
  const key = `rst.deliveryStatus.${status}`;
  const translated = t(key, { defaultValue: '' });
  if (translated && translated !== key) return translated;
  return status;
}

export const NEXT_DELIVERY_STATUS = {
  NEW: 'READY',
  READY: 'ON_THE_WAY',
  ON_THE_WAY: 'DELIVERED',
};
