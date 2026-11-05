import { describe, expect, it, beforeEach } from 'vitest';
import {
  hasMeaningfulStoreContent,
  readStoredStoreDraft,
  saveStoredStoreDraft,
  removeStoredStoreDraft,
  STORE_DRAFT_KEY,
} from './storeFormDraftUtils';

describe('storeFormDraftUtils', () => {
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

  it('detects meaningful store form content', () => {
    expect(hasMeaningfulStoreContent({})).toBe(false);
    expect(hasMeaningfulStoreContent({ name: '   ', active: true })).toBe(false);
    expect(hasMeaningfulStoreContent({ name: 'Filial 1' })).toBe(true);
    expect(hasMeaningfulStoreContent({ phone: '+998901234567' })).toBe(true);
    expect(hasMeaningfulStoreContent({ address: 'Toshkent' })).toBe(true);
    expect(hasMeaningfulStoreContent({ code: 'STORE-1' })).toBe(true);
  });

  it('does not save empty draft and returns null when reading empty draft', () => {
    saveStoredStoreDraft({ name: '', active: true });
    expect(sessionStorage.getItem(STORE_DRAFT_KEY)).toBeNull();
    expect(readStoredStoreDraft()).toBeNull();
  });

  it('saves and reads meaningful draft', () => {
    saveStoredStoreDraft({ name: 'Markaziy', active: true });
    const draft = readStoredStoreDraft();
    expect(draft).not.toBeNull();
    expect(draft.name).toBe('Markaziy');
  });

  it('removes stored draft', () => {
    saveStoredStoreDraft({ name: 'Markaziy' });
    expect(readStoredStoreDraft()).not.toBeNull();
    removeStoredStoreDraft();
    expect(readStoredStoreDraft()).toBeNull();
  });
});
