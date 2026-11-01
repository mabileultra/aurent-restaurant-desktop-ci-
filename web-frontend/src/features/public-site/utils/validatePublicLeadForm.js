/** Client-side gate before POST /public/site/leads — mirrors backend rules. */
export function validatePublicLeadForm({ name, phone }) {
  const trimmedName = String(name || '').trim();
  const trimmedPhone = String(phone || '').trim();
  const digits = trimmedPhone.replace(/\D/g, '');

  if (trimmedName.length < 2 || digits.length < 9) {
    return { ok: false };
  }
  return { ok: true, name: trimmedName, phone: trimmedPhone };
}
