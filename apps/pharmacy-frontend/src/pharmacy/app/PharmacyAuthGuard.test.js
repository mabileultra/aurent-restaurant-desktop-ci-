import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockAuthState = {
  token: null,
  user: null,
  _hasHydrated: true,
};

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => React.createElement('div', { 'data-navigate': to }),
  useLocation: () => ({ pathname: '/dashboard' }),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector) => selector(mockAuthState),
}));

import PharmacyAuthGuard from './PharmacyAuthGuard';

globalThis.React = React;

beforeEach(() => {
  mockAuthState.token = 'jwt-token';
  mockAuthState.user = { id: 1, role: 'ADMIN' };
  mockAuthState._hasHydrated = true;
});

describe('PharmacyAuthGuard', () => {
  it('перенаправляет на /login при отсутствии токена', () => {
    mockAuthState.token = null;
    const html = renderToStaticMarkup(
      React.createElement(PharmacyAuthGuard, { requireOffice: true }, React.createElement('span', null, 'office'))
    );
    expect(html).toContain('data-navigate="/login"');
  });

  it('перенаправляет CASHIER на /pos при попытке открыть админский раздел (requireOffice)', () => {
    mockAuthState.user = { id: 2, role: 'CASHIER' };
    const html = renderToStaticMarkup(
      React.createElement(PharmacyAuthGuard, { requireOffice: true }, React.createElement('span', null, 'office'))
    );
    expect(html).toContain('data-navigate="/pos"');
  });

  it('пропускает ADMIN в админский раздел (requireOffice)', () => {
    mockAuthState.user = { id: 1, role: 'ADMIN' };
    const html = renderToStaticMarkup(
      React.createElement(PharmacyAuthGuard, { requireOffice: true }, React.createElement('span', null, 'office'))
    );
    expect(html).toContain('<span>office</span>');
  });
});

