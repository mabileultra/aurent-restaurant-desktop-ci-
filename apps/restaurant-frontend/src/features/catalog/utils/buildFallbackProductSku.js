/** Fallback SKU when поле скрыто / не заполнено. */
export function buildFallbackProductSku(name) {
  const slug = String(name || 'item')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9А-ЯЁ]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 16);
  return `AUTO-${slug || 'ITEM'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}
