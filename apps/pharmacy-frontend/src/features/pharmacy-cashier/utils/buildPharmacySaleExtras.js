/**
 * Аптечные поля оплаты → notes + structured extras для CreateSaleRequest.
 * Retail не передаёт pharmacy* — функция вернёт null.
 */
export function buildPharmacySaleExtras(payment) {
  if (!payment || typeof payment !== 'object') return null;

  const pinfl = String(payment.pharmacyPinfl || '').replace(/\D/g, '').slice(0, 14);
  const phone = String(payment.pharmacyLoyaltyPhone || '').trim().slice(0, 32);
  const method = payment.pharmacyPayMethod ? String(payment.pharmacyPayMethod) : '';
  const dmed = Boolean(payment.pharmacyDmed) || method === 'insurance';

  if (!pinfl && !phone && !dmed && !method) return null;

  const parts = [];
  if (dmed) parts.push('DMED');
  if (pinfl) parts.push(`PINFL:${pinfl}`);
  if (phone) parts.push(`LOYALTY:${phone}`);
  if (method && method !== 'insurance') parts.push(`PAY:${method}`);

  return {
    notes: parts.join(' | '),
    patientPinfl: pinfl || undefined,
    loyaltyPhone: phone || undefined,
    pharmacyDmed: dmed || undefined,
  };
}
