import {
  normalizeCompanyLoginCode,
  persistCompanyLoginCode,
} from '../../../utils/authLogin';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';

/**
 * Bind company code on restaurant-desktop.
 * If local edge already has another company's data → confirm wipe + reset stack.
 */
export async function applyRestaurantDesktopCompanyCode(rawCode, { t } = {}) {
  const next = normalizeCompanyLoginCode(rawCode);
  if (!next) {
    return { ok: false, reason: 'invalid' };
  }

  if (!isRestaurantDesktop() || typeof window.aurentRestaurant?.resetEdgeTenant !== 'function') {
    persistCompanyLoginCode(next);
    return { ok: true, reset: false };
  }

  let bound = '';
  let hasStaff = false;
  try {
    bound = normalizeCompanyLoginCode(await window.aurentRestaurant.getCompanyLoginCode()) || '';
  } catch {
    bound = '';
  }
  try {
    const status = await window.aurentRestaurant.getEdgeAuthStatus?.();
    hasStaff = Boolean(status?.hasStaff);
    if (!bound) {
      bound = normalizeCompanyLoginCode(status?.boundCompanyLoginCode) || '';
    }
  } catch {
    /* ignore */
  }

  if (!hasStaff || !bound || bound === next) {
    try {
      await window.aurentRestaurant.setCompanyLoginCode(next);
    } catch {
      /* ignore */
    }
    persistCompanyLoginCode(next);
    return { ok: true, reset: false, companyLoginCode: next };
  }

  const label = t || ((key, opts) => opts?.defaultValue || key);
  const confirmed = window.confirm(
    label('cashierLogin.companySwitchConfirm', {
      from: bound,
      to: next,
      defaultValue:
        `Сменить компанию ${bound} → ${next}?\n\n`
        + 'Локальные зал, меню, смены и отчёты на этом ПК будут стёрты.\n'
        + 'Нужен интернет и вход админа (логин/пароль с r-aurent.uz).',
    })
  );
  if (!confirmed) {
    return { ok: false, reason: 'cancelled', revertTo: bound };
  }

  await window.aurentRestaurant.resetEdgeTenant({ companyLoginCode: next });
  persistCompanyLoginCode(next);
  return { ok: true, reset: true, companyLoginCode: next };
}
