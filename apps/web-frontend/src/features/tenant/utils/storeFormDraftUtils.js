export const STORE_DRAFT_KEY = 'draft_tenant_store_create';

export function hasMeaningfulStoreContent(form) {
  return Boolean(
    form?.name?.trim() ||
    form?.address?.trim() ||
    form?.phone?.trim() ||
    form?.code?.trim()
  );
}

export function readStoredStoreDraft() {
  try {
    const raw = sessionStorage.getItem(STORE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return hasMeaningfulStoreContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredStoreDraft(form) {
  if (hasMeaningfulStoreContent(form)) {
    try {
      sessionStorage.setItem(STORE_DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }
}

export function removeStoredStoreDraft() {
  try {
    sessionStorage.removeItem(STORE_DRAFT_KEY);
  } catch {}
}
