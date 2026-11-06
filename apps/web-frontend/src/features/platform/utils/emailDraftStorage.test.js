import { describe, expect, it, beforeEach } from 'vitest';
import {
  EMAIL_DRAFT_STORAGE_KEY,
  clearEmailDraft,
  loadEmailDraft,
  saveEmailDraft,
} from './emailDraftStorage';

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

globalThis.localStorage = new LocalStorageMock();

describe('emailDraftStorage', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('saves draft to localStorage and loads it back', () => {
    const draft = { subject: 'Test Subject', message: 'Hello world' };
    const success = saveEmailDraft(draft);
    expect(success).toBe(true);

    const loaded = loadEmailDraft();
    expect(loaded.subject).toBe('Test Subject');
    expect(loaded.message).toBe('Hello world');
    expect(typeof loaded.savedAt).toBe('number');
  });

  it('returns null if no draft exists', () => {
    expect(loadEmailDraft()).toBeNull();
  });

  it('clears draft from localStorage', () => {
    saveEmailDraft({ subject: 'Clear me' });
    expect(loadEmailDraft()).not.toBeNull();

    clearEmailDraft();
    expect(loadEmailDraft()).toBeNull();
  });

  it('handles invalid json gracefully', () => {
    globalThis.localStorage.setItem(EMAIL_DRAFT_STORAGE_KEY, 'invalid-json{{{');
    expect(loadEmailDraft()).toBeNull();
  });
});
