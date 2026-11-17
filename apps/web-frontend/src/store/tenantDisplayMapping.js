import { defaultReceiptFieldMap, mergeReceiptFields } from '../receiptProfile/receiptFieldCatalog';
import {
  RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
  RECEIPT_LOGO_HEIGHT_MIN_MM,
} from '../utils/syncReceiptDisplayCssVars';
import { printSettingsToPayload } from '../utils/tenantDisplaySync';

export const SYSTEM_LOGO_SIZE_DEFAULT_PX = 32;

export const SYSTEM_LOGO_SIZE_MIN_PX = 20;

export const SYSTEM_LOGO_SIZE_MAX_PX = 96;

export const LEGACY_STORAGE_KEY = 'pos-tenant-display';

/** Поля формы пользователя (кроме логина — всегда обязателен). */
export const USER_FORM_FIELD_DEFS = [
  { key: 'lastName', labelKey: 'users.lastName' },
  { key: 'firstName', labelKey: 'users.firstName' },
  { key: 'patronymic', labelKey: 'users.patronymic' },
  { key: 'email', labelKey: 'users.email' },
  { key: 'password', labelKey: 'users.password' },
  { key: 'role', labelKey: 'users.role' },
  { key: 'stores', labelKey: 'users.colStores' },
];

export function defaultFieldMap(defs) {
  return Object.fromEntries(defs.map((d) => [d.key, true]));
}

export function emptyDisplayState() {
  return {
    systemLogoDataUrl: null,
    systemLogoSizePx: SYSTEM_LOGO_SIZE_DEFAULT_PX,
    systemAppName: '',
    receiptLogoDataUrl: null,
    receiptLogoMaxHeightMm: RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
    receiptCompanyName: '',
    receiptCompanyAddress: '',
    receiptCompanyPhone: '',
    receiptStir: '',
    receiptFields: defaultReceiptFieldMap(),
    userFormFields: defaultFieldMap(USER_FORM_FIELD_DEFS),
    uiTheme: null,
  };
}

export function mergeFieldMap(defs, saved) {
  const base = defaultFieldMap(defs);
  if (!saved || typeof saved !== 'object') return base;
  for (const d of defs) {
    if (typeof saved[d.key] === 'boolean') base[d.key] = saved[d.key];
  }
  return base;
}

export function payloadToDisplay(payload) {
  const p = payload ?? {};
  return {
    systemLogoDataUrl: p.systemLogoDataUrl || null,
    systemLogoSizePx: clampLogoSize(p.systemLogoSizePx),
    systemAppName: String(p.systemAppName ?? '').trim(),
    receiptLogoDataUrl: p.receiptLogoDataUrl || null,
    receiptLogoMaxHeightMm: clampLogoHeightMm(p.receiptLogoMaxHeightMm),
    receiptCompanyName: String(p.receiptCompanyName ?? '').trim(),
    receiptCompanyAddress: String(p.receiptCompanyAddress ?? '').trim(),
    receiptCompanyPhone: String(p.receiptCompanyPhone ?? '').trim(),
    receiptStir: String(p.receiptStir ?? '').trim(),
    receiptFields: mergeReceiptFields(p.receiptFields),
    userFormFields: mergeFieldMap(USER_FORM_FIELD_DEFS, p.userFormFields),
    uiTheme: p.uiTheme && typeof p.uiTheme === 'object' ? p.uiTheme : null,
  };
}

export function cleanText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

export function displayToPayload(display) {
  const d = display ?? emptyDisplayState();
  return {
    systemLogoDataUrl: d.systemLogoDataUrl,
    systemLogoSizePx: d.systemLogoSizePx,
    systemAppName: cleanText(d.systemAppName),
    receiptLogoDataUrl: d.receiptLogoDataUrl,
    receiptLogoMaxHeightMm: d.receiptLogoMaxHeightMm,
    receiptCompanyName: cleanText(d.receiptCompanyName),
    receiptCompanyAddress: cleanText(d.receiptCompanyAddress),
    receiptCompanyPhone: cleanText(d.receiptCompanyPhone),
    receiptStir: cleanText(d.receiptStir),
    receiptFields: d.receiptFields,
    userFormFields: d.userFormFields,
    uiTheme: d.uiTheme && typeof d.uiTheme === 'object' ? d.uiTheme : null,
    printSettings: printSettingsToPayload(),
  };
}

export function isPayloadEmpty(payload) {
  if (!payload || typeof payload !== 'object') return true;
  const keys = [
    'systemLogoDataUrl',
    'systemAppName',
    'receiptLogoDataUrl',
    'receiptCompanyName',
    'receiptCompanyAddress',
    'receiptCompanyPhone',
    'receiptStir',
  ];
  return !keys.some((k) => {
    const v = payload[k];
    return v != null && String(v).trim() !== '';
  });
}

export function readLegacyLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? parsed;
  } catch {
    return null;
  }
}

export function readLegacyPrintSettings() {
  try {
    const raw = localStorage.getItem('pos-print-settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? parsed;
  } catch {
    return null;
  }
}

export function clampLogoSize(px) {
  const n = Number(px);
  if (!Number.isFinite(n)) return SYSTEM_LOGO_SIZE_DEFAULT_PX;
  return Math.min(SYSTEM_LOGO_SIZE_MAX_PX, Math.max(SYSTEM_LOGO_SIZE_MIN_PX, Math.round(n)));
}

export function clampLogoHeightMm(mm) {
  const n = Number(mm);
  if (!Number.isFinite(n)) return RECEIPT_LOGO_HEIGHT_DEFAULT_MM;
  return Math.min(RECEIPT_LOGO_HEIGHT_MAX_MM, Math.max(RECEIPT_LOGO_HEIGHT_MIN_MM, n));
}
