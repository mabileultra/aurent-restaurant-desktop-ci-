import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { usePlatformCompanyForm } from './usePlatformCompanyForm';

globalThis.React = React;

vi.mock('../../../api/companyBusinessType.api', () => ({
  companyBusinessTypeApi: {
    getForCompany: vi.fn(),
  },
}));

vi.mock('./useCompanyFormMutations', () => ({
  useCompanyFormMutations: () => ({
    saveMutation: { mutate: vi.fn(), isPending: false },
    deleteMutation: { mutate: vi.fn(), isPending: false },
    toggleActiveMutation: { mutate: vi.fn(), isPending: false },
  }),
}));

vi.mock('../utils/companyFormDraftUtils', () => ({
  readStoredCompanyDraft: vi.fn(() => null),
  saveStoredCompanyDraft: vi.fn(),
  removeStoredCompanyDraft: vi.fn(),
}));

describe('usePlatformCompanyForm', () => {
  const constructorTypes = [
    { id: 1, code: 'UNIVERSAL', name: 'Universal' },
    { id: 10, code: 'PHARMACY', name: 'Dorixona' },
    { id: 11, code: 'RETAIL', name: 'Roznitsa' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderHookHelper(props) {
    let hookResult = null;
    function Consumer() {
      hookResult = usePlatformCompanyForm(props);
      return React.createElement('div', null, hookResult.modalOpen ? 'OPEN' : 'CLOSED');
    }
    renderToStaticMarkup(React.createElement(Consumer));
    return hookResult;
  }

  it('initializes with default closed modal and empty form', () => {
    const result = renderHookHelper({ t: (k) => k, constructorTypes });
    expect(result.modalOpen).toBe(false);
    expect(result.editing).toBeNull();
    expect(result.form.name).toBe('');
    expect(result.companyToToggleActive).toBeNull();
    expect(typeof result.openCreate).toBe('function');
    expect(typeof result.openEdit).toBe('function');
    expect(typeof result.tryToggleActive).toBe('function');
    expect(typeof result.handleConfirmToggleActive).toBe('function');
  });

  it('exposes mutation handlers and draft controls', () => {
    const result = renderHookHelper({ t: (k) => k, constructorTypes });
    expect(result.isDeleting).toBe(false);
    expect(result.isTogglingActive).toBe(false);
    expect(typeof result.handleClearDraft).toBe('function');
    expect(typeof result.updateField).toBe('function');
    expect(typeof result.toggleBusinessType).toBe('function');
    expect(typeof result.setDefaultBusinessType).toBe('function');
  });
});
