function normalizeCompanyLoginCode(raw) {
  const digits = String(raw || '').trim().replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 10000 || n > 99999) return '';
  return String(n).padStart(5, '0');
}

const APP_WORLD_MAIN = 'main';
const APP_WORLD_RESTAURANT = 'restaurant';

function normalizeAppWorld(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (v === APP_WORLD_RESTAURANT || v === 'rst' || v === 'restaurant') {
    return APP_WORLD_RESTAURANT;
  }
  return APP_WORLD_MAIN;
}

/** Origin for the login shell — restaurant world stays on r-aurent, never hops after login. */
function loginUiOrigin(cfg) {
  if (normalizeAppWorld(cfg?.appWorld) === APP_WORLD_RESTAURANT) {
    return String(cfg?.restaurantUrl || cfg?.cashierUrl || '').replace(/\/$/, '');
  }
  return String(cfg?.cashierUrl || '').replace(/\/$/, '');
}

function buildLoginUrl(cfg) {
  const base = `${loginUiOrigin(cfg)}/cashier/login`;
  const code = normalizeCompanyLoginCode(cfg?.companyLoginCode);
  if (!code) return base;
  return `${base}?${new URLSearchParams({ companyLoginCode: code })}`;
}

module.exports = {
  normalizeCompanyLoginCode,
  normalizeAppWorld,
  loginUiOrigin,
  buildLoginUrl,
  APP_WORLD_MAIN,
  APP_WORLD_RESTAURANT,
};
