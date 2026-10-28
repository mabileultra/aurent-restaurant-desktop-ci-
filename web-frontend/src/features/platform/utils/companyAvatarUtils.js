import { Pill, Store, UtensilsCrossed } from 'lucide-react';

/**
 * Utilities for company brand avatars and styling in Platform Companies UI.
 */

const LEGAL_FORM_REGEX = /^(mchj|ooo|xk|ok|ya|ip|qoshma|korxona|chp|llc|inc)$/i;

const PALETTES = [
  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
  'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
  'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
  'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800',
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
 */
export function getBusinessTypeBadgeClass(code) {
  const normalized = (code || '').toUpperCase();
  switch (normalized) {
    case 'RESTAURANT':
    case 'CANTEEN':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'PHARMACY':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    case 'GROCERY':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'CLOTHING':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    case 'UNIVERSAL':
    case 'RETAIL':
      return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

/**
 * Returns contextual branch metadata (icon, label, tooltip, styling) based on company business type.
 * e.g., Restaurants show UtensilsCrossed (🍽️) + "Restoran filiallari",
 * Pharmacies show Pill (💊) + "Dorixona filiallari",
 * Retail/General show Store (🏪) + "Filiallar".
 */
export function getCompanyBranchMeta(businessType, t = (k, opts) => opts?.defaultValue || k) {
  const normalized = (businessType || '').toUpperCase();
  switch (normalized) {
    case 'RESTAURANT':
    case 'CANTEEN':
      return {
        icon: UtensilsCrossed,
        label: t('platform.branchTypes.restaurant', { defaultValue: 'Filiallar' }),
        tooltip: t('platform.viewCompanyBranchesRestaurant', { defaultValue: 'Restoran filiallarini ko‘rish' }),
        badgeClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 border-amber-200/80 dark:border-amber-800/60',
      };
    case 'PHARMACY':
      return {
        icon: Pill,
        label: t('platform.branchTypes.pharmacy', { defaultValue: 'Filiallar' }),
        tooltip: t('platform.viewCompanyBranchesPharmacy', { defaultValue: 'Dorixona filiallarini ko‘rish' }),
        badgeClass: 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/50 border-sky-200/80 dark:border-sky-800/60',
      };
    default:
      return {
        icon: Store,
        label: t('platform.branchTypes.default', { defaultValue: 'Filiallar' }),
        tooltip: t('platform.viewCompanyBranchesDefault', { defaultValue: 'Filiallarni ko‘rish' }),
        badgeClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border-emerald-200/80 dark:border-emerald-800/60',
      };
  }
}
