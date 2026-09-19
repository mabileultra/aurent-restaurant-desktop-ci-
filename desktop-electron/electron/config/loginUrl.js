function normalizeCompanyLoginCode(raw) {
  const digits = String(raw || '').trim().replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 10000 || n > 99999) return '';
  return String(n).padStart(5, '0');
}

function buildLoginUrl(cfg) {
  const base = `${String(cfg?.cashierUrl || '').replace(/\/$/, '')}/cashier/login`;
  const code = normalizeCompanyLoginCode(cfg?.companyLoginCode);
  if (!code) return base;
  return `${base}?${new URLSearchParams({ companyLoginCode: code })}`;
}

module.exports = {
  normalizeCompanyLoginCode,
  buildLoginUrl,
};
