/**
 * Xavfsizlik bo'limi uchun konstantalar va standart sozlamalar.
 */

export const SECURITY_TAB_KEYS = Object.freeze({
  OVERVIEW: 'overview',
  SESSIONS: 'sessions',
  AUDIT: 'audit',
  STAFF: 'staff',
  RULES: 'rules',
});

export const SECURITY_TABS = Object.freeze([
  { id: SECURITY_TAB_KEYS.OVERVIEW, key: 'platform.security.tabs.overview', label: 'Umumiy holat' },
  { id: SECURITY_TAB_KEYS.SESSIONS, key: 'platform.security.tabs.sessions', label: 'Kirishlar va seanslar' },
  { id: SECURITY_TAB_KEYS.AUDIT, key: 'platform.security.tabs.audit', label: 'Harakatlar jurnali' },
  { id: SECURITY_TAB_KEYS.STAFF, key: 'platform.security.tabs.staff', label: 'Xodimlar', showCount: true },
  { id: SECURITY_TAB_KEYS.RULES, key: 'platform.security.tabs.rules', label: 'Kirish qoidalari' },
]);

export const DEFAULT_SECURITY_RULES = Object.freeze({
  tfa: { sa: true, op: false, an: false },
  method: 'app',
  minLen: 10,
  expiry: 90,
  req: { case: true, digit: true, special: false, history: true },
  idle: 0,
  maxH: 12,
  conc: 3,
  notify: true,
  attempts: 5,
  lockMin: 15,
  ipOn: false,
  ips: [],
});

export const AUDIT_MODULES = Object.freeze([
  { id: 'all', label: 'Barchasi' },
  { id: 'comp', label: 'Kompaniyalar' },
  { id: 'users', label: 'Foydalanuvchilar' },
  { id: 'billing', label: 'To‘lov va tariflar' },
  { id: 'access', label: 'Ruxsatlar' },
  { id: 'security', label: 'Xavfsizlik' },
  { id: 'mail', label: 'Pochta' },
]);

export const STAFF_ROLES_CONFIG = Object.freeze({
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    label: 'Super-admin',
    bg: '#043D2C',
    fg: '#FFFFFF',
    desc: 'Platformaning barcha bo‘limlari, xavfsizlik va xodimlarni boshqarish.',
  },
  PLATFORM_ADMIN: {
    id: 'PLATFORM_ADMIN',
    label: 'Platforma operatori',
    bg: '#E6F2EC',
    fg: '#043D2C',
    desc: 'Faqat «Kirish huquqlari»da ochilgan bo‘limlar. Xavfsizlikka kira olmaydi.',
  },
  PLATFORM_ANALYTICS: {
    id: 'PLATFORM_ANALYTICS',
    label: 'Platforma analitigi',
    bg: '#EFF6FF',
    fg: '#1D4ED8',
    desc: 'Faqat Analitika bo‘limini ko‘radi, hech narsani o‘zgartira olmaydi.',
  },
});

export const PERMISSIONS_MATRIX_ROWS = Object.freeze([
  { name: 'Kompaniyalar va filiallar', sa: 'full', op: 'grant', an: 'none' },
  { name: 'Foydalanuvchilar', sa: 'full', op: 'grant', an: 'none' },
  { name: 'To‘lovlar va kassa', sa: 'full', op: 'grant', an: 'none' },
  { name: 'Analitika', sa: 'full', op: 'grant', an: 'view' },
  { name: 'Pochta', sa: 'full', op: 'grant', an: 'none' },
  { name: 'Kirish huquqlari va Xavfsizlik', sa: 'full', op: 'none', an: 'none' },
]);
