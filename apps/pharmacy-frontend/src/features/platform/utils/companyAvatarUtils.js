import { Pill, Store, UtensilsCrossed } from 'lucide-react';

/**
 * Utilities for company brand avatars and styling in Platform Companies UI.
 */

const LEGAL_FORM_REGEX = /^(mchj|ooo|xk|ok|ya|ip|qoshma|korxona|chp|llc|inc)$/i;

const PALETTES = [
  'bg-primary-50 text-primary-700 border-primary-200',
  'bg-primary-100 text-primary-800 border-primary-200',
  'bg-info-soft text-info-text border-info/25',
  'bg-canvas text-ink border-line',
];

/**
 * Returns 1-2 uppercase letters representing the company initials.
 * Strips punctuation, quotes, and trailing legal forms when possible.
 */
export function getCompanyInitials(name) {
  if (!name || typeof name !== 'string') return 'CO';

  // Remove common quote types and clean
  const clean = name.replace(/["'«»“”„]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length === 0) return 'CO';

  // Filter out trailing legal forms if there are other words
  const significant = words.filter((w, idx) => {
    if (words.length > 1 && LEGAL_FORM_REGEX.test(w) && idx === words.length - 1) {
      return false;
    }
    return true;
  });

  const targetWords = significant.length > 0 ? significant : words;

  if (targetWords.length === 1) {
    const single = targetWords[0];
    return single.slice(0, 2).toUpperCase();
  }

  const first = targetWords[0][0] || '';
  const second = targetWords[1][0] || '';
  return (first + second).toUpperCase();
}

/**
 * Deterministically picks a color palette based on string hash or id.
 */
export function getCompanyPalette(name, id) {
  const seed = `${name || ''}-${id || ''}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

/**
 * Returns tailored badge classes for business type codes.
 * Clean, neutral B2B styling (Slate) to avoid color noise and rainbow effect.
 */
export function getBusinessTypeBadgeClass() {
  return 'bg-canvas text-ink-muted border-line';
}

/**
 * Returns contextual branch metadata (icon, label, tooltip, styling) based on company business type.
 */
export function getCompanyBranchMeta(businessType, t = (k, opts) => opts?.defaultValue || k) {
  const normalized = (businessType || '').toUpperCase();
  const brandBadgeClass =
    'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200';

  switch (normalized) {
    case 'RESTAURANT':
    case 'CANTEEN':
      return {
        icon: UtensilsCrossed,
        label: t('platform.branchTypes.restaurant', { defaultValue: 'Filiallar' }),
        tooltip: t('platform.viewCompanyBranchesRestaurant', { defaultValue: 'Restoran filiallarini ko‘rish' }),
        badgeClass: brandBadgeClass,
      };
    case 'PHARMACY':
      return {
        icon: Pill,
        label: t('platform.branchTypes.pharmacy', { defaultValue: 'Filiallar' }),
        tooltip: t('platform.viewCompanyBranchesPharmacy', { defaultValue: 'Dorixona filiallarini ko‘rish' }),
        badgeClass: brandBadgeClass,
      };
    default:
      return {
        icon: Store,
        label: t('platform.branchTypes.default', { defaultValue: 'Filiallar' }),
        tooltip: t('platform.viewCompanyBranchesDefault', { defaultValue: 'Filiallarni ko‘rish' }),
        badgeClass: brandBadgeClass,
      };
  }
}
