import { describe, expect, it, beforeEach } from 'vitest';
import {
  COMPANY_DRAFT_KEY,
  readStoredCompanyDraft,
  saveStoredCompanyDraft,
  removeStoredCompanyDraft,
} from './companyFormDraftUtils';

describe('companyFormDraftUtils', () => {
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    globalThis.sessionStorage = {
      getItem: (key) => mockStore[key] ?? null,
      setItem: (key, val) => { mockStore[key] = String(val); },
      removeItem: (key) => { delete mockStore[key]; },
      clear: () => { mockStore = {}; },
    };
  });

  it('returns null when sessionStorage is empty', () => {
    expect(readStoredCompanyDraft()).toBeNull();
  });

  it('saves and reads draft only when non-empty fields exist', () => {
    // Empty form should not be saved
    saveStoredCompanyDraft({ name: '', legalName: '   ', tin: '', phone: '', address: '' });
    expect(readStoredCompanyDraft()).toBeNull();

    // Form with actual data should be saved
    const validDraft = { name: 'Aurent Test', tin: '123456789' };
    saveStoredCompanyDraft(validDraft);
    expect(readStoredCompanyDraft()).toEqual(validDraft);
  });

  it('removes draft correctly', () => {
    sessionStorage.setItem(COMPANY_DRAFT_KEY, JSON.stringify({ name: 'Draft To Delete' }));
    expect(readStoredCompanyDraft()).not.toBeNull();

    removeStoredCompanyDraft();
    expect(readStoredCompanyDraft()).toBeNull();
  });
});
