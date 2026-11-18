import { create } from 'zustand';
import { APP_NAME } from '../config/brand';
import { defaultReceiptFieldMap, isReceiptFieldOn as fieldOn } from '../receiptProfile/receiptFieldCatalog';
import { tenantDisplayApi } from '../services/api';
import { syncReceiptDisplayCssVars } from '../utils/syncReceiptDisplayCssVars';
import { applyPrintSettingsFromPayload, isPrintDirtySuppressed } from '../utils/tenantDisplaySync';
import { useAuthStore } from './authStore';
import { usePrintSettingsStore } from './printSettingsStore';
import {
  USER_FORM_FIELD_DEFS,
  defaultFieldMap,
  emptyDisplayState,
  payloadToDisplay,
  displayToPayload,
  isPayloadEmpty,
  readLegacyLocalStorage,
  readLegacyPrintSettings,
  clampLogoSize,
  clampLogoHeightMm,
} from './tenantDisplayMapping';

export {
  RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
  RECEIPT_LOGO_HEIGHT_MIN_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
} from '../utils/syncReceiptDisplayCssVars';

export { RECEIPT_FIELD_DEFS } from '../receiptProfile/receiptFieldCatalog';

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
  setUserFormField: (key, enabled) =>
    set((s) => ({
      draft: {
        ...s.draft,
        userFormFields: { ...s.draft.userFormFields, [key]: !!enabled },
      },
      isDirty: true,
    })),

  resetReceiptFields: () =>
    patchDraft(set, { receiptFields: defaultReceiptFieldMap() }),
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
          // Platform SA/ops have no company context — PUT is ADMIN-only and returns 403.
          const role = useAuthStore.getState()?.user?.role;
          const canMigrateToServer = role === 'ADMIN' || role === 'MANAGER';
          if (canMigrateToServer) {
            try {
              await get().saveToServer();
            } catch {
              /* migration best-effort */
            }
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

export {
  SYSTEM_LOGO_SIZE_DEFAULT_PX,
  SYSTEM_LOGO_SIZE_MIN_PX,
  SYSTEM_LOGO_SIZE_MAX_PX,
  USER_FORM_FIELD_DEFS,
} from './tenantDisplayMapping';
