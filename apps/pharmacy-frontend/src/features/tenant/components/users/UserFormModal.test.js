import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import UserFormModal from './UserFormModal';

globalThis.React = React;

vi.mock('../../hooks/useUserFormModal', () => ({
  useUserFormModal: (props) => ({
    open: props.open ?? true,
    isEdit: false,
    isDirty: false,
    isPending: false,
    onClose: props.onClose ?? vi.fn(),
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : fallback?.defaultValue || key),
    createdCredentials: null,
    dismissCredentials: vi.fn(),
    handleSubmit: () => vi.fn(),
    onSubmit: vi.fn(),
    register: () => ({}),
    setValue: vi.fn(),
    errors: {},
    companies: [],
    companyId: '',
    setCompanyId: vi.fn(),
    storeOptions: [],
    storeIds: new Set(),
    setStoreIds: vi.fn(),
    toggleStore: vi.fn(),
    selectedRole: '',
    roleAllowList: [],
    isPlatform: true,
  }),
}));

vi.mock('./UserFormModalFields', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-fields' }, 'Fields'),
}));

vi.mock('./UserCredentialsCreatedModal', () => ({
  default: () => null,
}));

describe('UserFormModal', () => {
  it('renders modal with role="dialog" and accessibility attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(UserFormModal, { open: true, onClose: vi.fn() })
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="user-form-modal-title"');
    expect(html).toContain('data-testid="mock-fields"');
  });

  it('returns null when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(UserFormModal, { open: false, onClose: vi.fn() })
    );

    expect(html).toBe('');
  });
});
