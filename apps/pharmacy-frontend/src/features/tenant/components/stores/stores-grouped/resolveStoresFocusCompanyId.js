export function resolveStoresFocusCompanyId(focusCompanyId) {
  if (focusCompanyId != null && focusCompanyId !== '') {
    const parsed = Number(focusCompanyId);
    return Number.isNaN(parsed) ? focusCompanyId : parsed;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  const sp = new URLSearchParams(window.location.search);
  const spFocus = sp.get('focusCompany') || sp.get('company');
  if (spFocus) {
    const parsed = Number(spFocus);
    return Number.isNaN(parsed) ? spFocus : parsed;
  }
  if (window.location.hash?.startsWith('#company-')) {
    const hashVal = window.location.hash.replace('#company-', '');
    const parsed = Number(hashVal);
    return Number.isNaN(parsed) ? hashVal : parsed;
  }
  return null;
}

export function clearStoresFocusFromUrl() {
  if (typeof window === 'undefined' || !window.history?.replaceState) {
    return;
  }
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('focusCompany') && !url.searchParams.has('company') && !url.hash) {
      return;
    }
    url.searchParams.delete('focusCompany');
    url.searchParams.delete('company');
    url.hash = '';
    window.history.replaceState({}, '', url.pathname + (url.search || ''));
  } catch {
    // ignore non-browser
  }
}
