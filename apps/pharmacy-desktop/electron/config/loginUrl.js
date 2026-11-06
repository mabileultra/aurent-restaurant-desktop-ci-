function normalizeCompanyLoginCode(raw) {
  const digits = String(raw || '').trim().replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 10000 || n > 99999) return '';
  return String(n).padStart(5, '0');
}

/** Pharmacy desktop is a single world — no grocery/restaurant switch. */
const APP_WORLD_PHARMACY = 'pharmacy';
const APP_WORLD_MAIN = APP_WORLD_PHARMACY;
const APP_WORLD_RESTAURANT = 'restaurant';

function normalizeAppWorld() {
  return APP_WORLD_PHARMACY;
}

function loginUiOrigin(cfg) {
  return String(cfg?.cashierUrl || '').replace(/\/$/, '');
}

/** Pharmacy SPA login (p-aurent), not grocery /cashier/login. */
function buildLoginUrl(cfg) {
  const base = `${loginUiOrigin(cfg)}/login`;
  const code = normalizeCompanyLoginCode(cfg?.companyLoginCode);
  if (!code) return base;
  return `${base}?${new URLSearchParams({ companyLoginCode: code })}`;
}

function buildAdminLoginUrl(cfg) {
  return `${loginUiOrigin(cfg)}/login?admin=1`;
}

module.exports = {
  normalizeCompanyLoginCode,
  normalizeAppWorld,
  loginUiOrigin,
  buildLoginUrl,
  buildAdminLoginUrl,
  APP_WORLD_MAIN,
  APP_WORLD_PHARMACY,
  APP_WORLD_RESTAURANT,
};
