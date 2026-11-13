/**
 * selectUtils.js — aa/Select yordamchi funksiyalari.
 */

/**
 * Qidiruv uchun matnni normalizatsiya qilish.
 * Katta-kichik harf farq qilmaydi, barcha apostroflar (‘, ’, ’, `) bitta ' belgisiga keltiriladi.
 */
export function normalizeSearchText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .toLowerCase()
    .replace(/[‘’’`]/g, "'")
    .trim();
}

/**
 * Variantlar ro‘yxatini qidiruv matni bo‘yicha filtrlash.
 */
export function filterSelectOptions(options = [], query = '') {
  if (!Array.isArray(options)) return [];
  if (!query) return options;

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return options;

  return options.filter((opt) =>
    normalizeSearchText(opt?.label).includes(normalizedQuery)
  );
}

/**
 * Klaviaturada yuqoriga/pastga yurilganda navbatdagi faol (disabled bo‘lmagan) indeksni topish.
 */
export function findNextEnabledIndex(options = [], currentIndex = -1, direction = 1) {
  if (!Array.isArray(options) || options.length === 0) return -1;

  let next = currentIndex + direction;
  while (next >= 0 && next < options.length) {
    if (!options[next]?.disabled) return next;
    next += direction;
  }
  return currentIndex;
}

/**
 * Qidiruvsiz ro‘yxatda harf bosilganda birinchi mos keluvchi faol indeksni topish.
 */
export function findOptionStartingWith(options = [], char = '') {
  if (!Array.isArray(options) || !char) return -1;
  const normalizedChar = normalizeSearchText(char);
  if (!normalizedChar) return -1;

  return options.findIndex(
    (opt) => !opt?.disabled && normalizeSearchText(opt?.label).startsWith(normalizedChar)
  );
}
