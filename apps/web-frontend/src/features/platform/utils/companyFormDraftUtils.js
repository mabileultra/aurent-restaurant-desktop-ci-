export const COMPANY_DRAFT_KEY = 'draft_platform_company_create';

export function readStoredCompanyDraft() {
  try {
    const raw = sessionStorage.getItem(COMPANY_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const hasContent = Boolean(
      parsed?.name?.trim() ||
      parsed?.legalName?.trim() ||
      parsed?.tin?.trim() ||
      parsed?.phone?.trim() ||
      parsed?.address?.trim()
    );
    return hasContent ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredCompanyDraft(form) {
  const hasContent = Boolean(
    form.name?.trim() || form.legalName?.trim() || form.tin?.trim() || form.phone?.trim() || form.address?.trim()
  );
  if (hasContent) {
    try {
      sessionStorage.setItem(COMPANY_DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }
}

export function removeStoredCompanyDraft() {
  try {
    sessionStorage.removeItem(COMPANY_DRAFT_KEY);
  } catch {}
}
