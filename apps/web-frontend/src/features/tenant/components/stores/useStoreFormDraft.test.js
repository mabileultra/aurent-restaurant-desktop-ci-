import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { useStoreFormDraft } from './useStoreFormDraft';

globalThis.React = React;

describe('useStoreFormDraft', () => {
  function renderHookHelper(props) {
    let hookResult = null;
    function TestComponent() {
      hookResult = useStoreFormDraft(props);
      return React.createElement('div', null, 'OK');
    }
    renderToStaticMarkup(React.createElement(TestComponent));
    return hookResult;
  }

  it('initializes with no draft when storage is empty', () => {
    const reset = vi.fn();
    const result = renderHookHelper({
      open: true,
      isCreate: true,
      initial: null,
      reset,
      watchedValues: { name: 'Test' },
    });

    expect(result.initialDraft).toBeNull();
    expect(result.isDraftRestored).toBe(false);
  });

  it('restores draft and allows clearing it from storage and resetting form', () => {
    let mockStorage = {
      draft_tenant_store_create: JSON.stringify({ name: 'Saqlangan filial' }),
    };
    globalThis.sessionStorage = {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; },
      clear: () => { mockStorage = {}; },
    };

    const reset = vi.fn();
    const result = renderHookHelper({
      open: true,
      isCreate: true,
      initial: null,
      reset,
      watchedValues: { name: 'Saqlangan filial' },
    });

    expect(result.isDraftRestored).toBe(true);
    expect(result.initialDraft).toEqual({ name: 'Saqlangan filial' });

    result.handleClearDraft();

    expect(mockStorage.draft_tenant_store_create).toBeUndefined();
    expect(reset).toHaveBeenCalledWith(expect.objectContaining({ name: '' }));

    delete globalThis.sessionStorage;
  });

  it('clears draft from storage on successful submit', () => {
    let mockStorage = {
      draft_tenant_store_create: JSON.stringify({ name: 'Filial 1' }),
    };
    globalThis.sessionStorage = {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; },
      clear: () => { mockStorage = {}; },
    };

    const reset = vi.fn();
    const result = renderHookHelper({
      open: true,
      isCreate: true,
      initial: null,
      reset,
      watchedValues: { name: 'Filial 1' },
    });

    result.clearDraftOnSuccess();

    expect(mockStorage.draft_tenant_store_create).toBeUndefined();

    delete globalThis.sessionStorage;
  });
});
