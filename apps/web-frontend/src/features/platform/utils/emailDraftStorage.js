export const EMAIL_DRAFT_STORAGE_KEY = 'aurent_platform_email_draft_v1';

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

export function loadEmailDraft() {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(EMAIL_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveEmailDraft(draft) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(
      EMAIL_DRAFT_STORAGE_KEY,
      JSON.stringify({
        ...draft,
        savedAt: Date.now(),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function clearEmailDraft() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(EMAIL_DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage deletion errors
  }
}
