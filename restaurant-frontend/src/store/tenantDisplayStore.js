import { create } from 'zustand';
import { APP_NAME } from '../config/brand';
import {
  defaultReceiptFieldMap,
  isReceiptFieldOn as fieldOn,
  mergeReceiptFields,
} from '../receiptProfile/receiptFieldCatalog';
import {
  coerceReceiptFieldStyle,
  defaultReceiptFieldStyles,
  mergeReceiptFieldStyles,
} from '../receiptProfile/receiptFieldStyles';
import { tenantDisplayApi } from '../services/api';
import {
  syncReceiptDisplayCssVars,
  RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
  RECEIPT_LOGO_HEIGHT_MIN_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
} from '../utils/syncReceiptDisplayCssVars';
import {
  applyPrintSettingsFromPayload,
  printSettingsToPayload,
  isPrintDirtySuppressed,
} from '../utils/tenantDisplaySync';
import { usePrintSettingsStore } from './printSettingsStore';

export {
  RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
  RECEIPT_LOGO_HEIGHT_MIN_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
} from '../utils/syncReceiptDisplayCssVars';

export { RECEIPT_FIELD_DEFS } from '../receiptProfile/receiptFieldCatalog';

export const SYSTEM_LOGO_SIZE_DEFAULT_PX = 32;
export const SYSTEM_LOGO_SIZE_MIN_PX = 20;
export const SYSTEM_LOGO_SIZE_MAX_PX = 96;

const LEGACY_STORAGE_KEY = 'pos-tenant-display';

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

function defaultFieldMap(defs) {
  return Object.fromEntries(defs.map((d) => [d.key, true]));
}

function emptyDisplayState() {
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
    receiptFieldStyles: defaultReceiptFieldStyles(),
    userFormFields: defaultFieldMap(USER_FORM_FIELD_DEFS),
    /** Reserved for per-company UI theme (null until theme UI). */
    uiTheme: null,
  };
}

function mergeFieldMap(defs, saved) {
  const base = defaultFieldMap(defs);
  if (!saved || typeof saved !== 'object') return base;
  for (const d of defs) {
    if (typeof saved[d.key] === 'boolean') base[d.key] = saved[d.key];
  }
  return base;
}

function payloadToDisplay(payload) {
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
    receiptFieldStyles: mergeReceiptFieldStyles(p.receiptFieldStyles),
    userFormFields: mergeFieldMap(USER_FORM_FIELD_DEFS, p.userFormFields),
    uiTheme: p.uiTheme && typeof p.uiTheme === 'object' ? p.uiTheme : null,
  };
}

function cleanText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function displayToPayload(display) {
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
    receiptFieldStyles: d.receiptFieldStyles,
    userFormFields: d.userFormFields,
    uiTheme: d.uiTheme && typeof d.uiTheme === 'object' ? d.uiTheme : null,
    printSettings: printSettingsToPayload(),
  };
}

function isPayloadEmpty(payload) {
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

function readLegacyLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? parsed;
  } catch {
    return null;
  }
}

function readLegacyPrintSettings() {
  try {
    const raw = localStorage.getItem('pos-print-settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? parsed;
  } catch {
    return null;
  }
}

function clampLogoSize(px) {
  const n = Number(px);
  if (!Number.isFinite(n)) return SYSTEM_LOGO_SIZE_DEFAULT_PX;
  return Math.min(SYSTEM_LOGO_SIZE_MAX_PX, Math.max(SYSTEM_LOGO_SIZE_MIN_PX, Math.round(n)));
}

function clampLogoHeightMm(mm) {
  const n = Number(mm);
  if (!Number.isFinite(n)) return RECEIPT_LOGO_HEIGHT_DEFAULT_MM;
  return Math.min(RECEIPT_LOGO_HEIGHT_MAX_MM, Math.max(RECEIPT_LOGO_HEIGHT_MIN_MM, n));
}

function patchDraft(set, patch) {
  set((s) => ({
    draft: { ...s.draft, ...patch },
    isDirty: true,
  }));
}

export const useTenantDisplayStore = create((set, get) => ({
  committed: emptyDisplayState(),
  draft: emptyDisplayState(),
  isDirty: false,
  isLoading: false,
  isSaving: false,

  displayAppName: () => {
    const custom = get().committed.systemAppName;
    return custom || APP_NAME;
  },

  isReceiptFieldOn: (key) => fieldOn(get().committed.receiptFields, key),
  isUserFormFieldOn: (key) => get().committed.userFormFields[key] !== false,

  setSystemLogo: (dataUrl) => patchDraft(set, { systemLogoDataUrl: dataUrl || null }),
  clearSystemLogo: () => patchDraft(set, { systemLogoDataUrl: null }),
  setSystemLogoSizePx: (px) => patchDraft(set, { systemLogoSizePx: clampLogoSize(px) }),
  // Do not trim on every keystroke — that removes spaces while typing.
  setSystemAppName: (name) => patchDraft(set, { systemAppName: String(name ?? '') }),

  setReceiptLogo: (dataUrl) => patchDraft(set, { receiptLogoDataUrl: dataUrl || null }),
  clearReceiptLogo: () => patchDraft(set, { receiptLogoDataUrl: null }),
  setReceiptLogoMaxHeightMm: (mm) => {
    const clamped = clampLogoHeightMm(mm);
    patchDraft(set, { receiptLogoMaxHeightMm: clamped });
    queueMicrotask(() => syncReceiptDisplayCssVars({ ...get().draft, receiptLogoMaxHeightMm: clamped }));
  },
  setReceiptCompanyName: (v) => patchDraft(set, { receiptCompanyName: String(v ?? '') }),
  setReceiptCompanyAddress: (v) => patchDraft(set, { receiptCompanyAddress: String(v ?? '') }),
  setReceiptCompanyPhone: (v) => patchDraft(set, { receiptCompanyPhone: String(v ?? '') }),
  setReceiptStir: (v) => patchDraft(set, { receiptStir: String(v ?? '') }),

  setReceiptField: (key, enabled) =>
    set((s) => ({
      draft: {
        ...s.draft,
        receiptFields: { ...s.draft.receiptFields, [key]: !!enabled },
      },
      isDirty: true,
    })),
  setReceiptFieldStyle: (key, patch) =>
    set((s) => {
      const prev = coerceReceiptFieldStyle(s.draft.receiptFieldStyles?.[key]);
      return {
        draft: {
          ...s.draft,
          receiptFieldStyles: {
            ...s.draft.receiptFieldStyles,
            [key]: coerceReceiptFieldStyle({ ...prev, ...patch }),
          },
        },
        isDirty: true,
      };
    }),
  setUserFormField: (key, enabled) =>
    set((s) => ({
      draft: {
        ...s.draft,
        userFormFields: { ...s.draft.userFormFields, [key]: !!enabled },
      },
      isDirty: true,
    })),

  resetReceiptFields: () =>
    patchDraft(set, {
      receiptFields: defaultReceiptFieldMap(),
      receiptFieldStyles: defaultReceiptFieldStyles(),
    }),
  resetUserFormFields: () =>
    patchDraft(set, { userFormFields: defaultFieldMap(USER_FORM_FIELD_DEFS) }),

  applyDraftToCommitted: () => {
    const { draft } = get();
    set({ committed: { ...draft }, isDirty: false });
    syncReceiptDisplayCssVars(draft);
  },

  discardDraft: () => {
    const { committed } = get();
    set({ draft: { ...committed }, isDirty: false });
    syncReceiptDisplayCssVars(committed);
  },

  resetSession: () => {
    const empty = emptyDisplayState();
    set({
      committed: empty,
      draft: empty,
      isDirty: false,
      isLoading: false,
      isSaving: false,
    });
    syncReceiptDisplayCssVars(empty);
  },

  hydrateFromPayload: (payload) => {
    const display = payloadToDisplay(payload);
    set({
      draft: display,
      committed: display,
      isDirty: false,
    });
    syncReceiptDisplayCssVars(display);
    applyPrintSettingsFromPayload(payload?.printSettings);
  },

  fetchFromServer: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const { data } = await tenantDisplayApi.get();
      if (isPayloadEmpty(data)) {
        const legacy = readLegacyLocalStorage();
        if (legacy) {
          const legacyDisplay = payloadToDisplay(legacy);
          get().hydrateFromPayload({
            ...displayToPayload(legacyDisplay),
            printSettings: readLegacyPrintSettings(),
          });
          try {
            await get().saveToServer();
          } catch {
            /* migration best-effort */
          }
          return;
        }
      }
      get().hydrateFromPayload(data);
    } catch {
      /* offline / not migrated yet — keep local defaults */
    } finally {
      set({ isLoading: false });
    }
  },

  saveToServer: async () => {
    if (get().isSaving) return;
    set({ isSaving: true });
    try {
      const body = displayToPayload(get().draft);
      const { data } = await tenantDisplayApi.save(body);
      get().hydrateFromPayload(data);
    } finally {
      set({ isSaving: false });
    }
  },
}));

useTenantDisplayStore.subscribe((state, prev) => {
  if (state.committed.receiptLogoMaxHeightMm !== prev.committed.receiptLogoMaxHeightMm) {
    syncReceiptDisplayCssVars(state.committed);
  }
});

usePrintSettingsStore.subscribe(() => {
  if (isPrintDirtySuppressed()) return;
  const { isLoading } = useTenantDisplayStore.getState();
  if (isLoading) return;
  useTenantDisplayStore.setState({ isDirty: true });
});
