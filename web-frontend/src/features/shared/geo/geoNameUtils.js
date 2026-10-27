/**
 * Normalizes Uzbek geographic names by cleaning escaped double apostrophes.
 * E.g. "Qoraqalpog''iston" -> "Qoraqalpog‘iston"
 *      "Bulung''ur" -> "Bulung‘ur"
 *      "Farg''ona" -> "Farg‘ona"
 */
export function cleanGeoName(text) {
  if (!text) return '';
  return String(text).replace(/''/g, '‘').replace(/`/g, '‘');
}
