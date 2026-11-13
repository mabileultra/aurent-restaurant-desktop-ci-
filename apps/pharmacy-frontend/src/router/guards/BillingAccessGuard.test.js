import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockState = {
  isAuthenticated: true,
  user: { id: 1, role: 'ADMIN', companyId: 10 },
  pathname: '/dashboard',
  skipOnline: false,
  queryData: null,
  isLoading: false,
  visibleNotice: false,
};

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => React.createElement('div', { 'data-navigate': to }),
  useLocation: () => ({ pathname: mockState.pathname }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mockState.queryData, isLoading: mockState.isLoading }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../../api', () => ({
  tenantBillingApi: { access: vi.fn() },
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: () => mockState.isAuthenticated,
    user: mockState.user,
  }),
}));

vi.mock('../../store/connectivityStore', () => ({
  useShouldUseOfflinePos: () => mockState.skipOnline,
}));

vi.mock('../../features/billing/useBillingPaymentNotice', () => ({
  useBillingPaymentNotice: () => ({ visible: mockState.visibleNotice, dismiss: vi.fn() }),
}));

vi.mock('../../features/billing/BillingPaymentNoticeOverlay', () => ({
  default: ({ open, isAdmin, billingPath }) => (
    open
      ? React.createElement('div', {
          'data-notice-admin': String(isAdmin),
          'data-notice-path': billingPath,
        })
      : null
  ),
}));

import BillingAccessGuard from './BillingAccessGuard';

globalThis.React = React;

beforeEach(() => {
  mockState.isAuthenticated = true;
  mockState.user = { id: 1, role: 'ADMIN', companyId: 10 };
  mockState.pathname = '/dashboard';
  mockState.skipOnline = false;
  mockState.queryData = { billingEnabled: true, accessAllowed: true };
  mockState.isLoading = false;
  mockState.visibleNotice = false;
});

describe('BillingAccessGuard', () => {
  it('при заблокированной подписке перенаправляет ADMIN и ACCOUNTANT на /billing и пускает на сам /billing', () => {
    mockState.queryData = { billingEnabled: true, accessAllowed: false };

    for (const role of ['ADMIN', 'ACCOUNTANT']) {
      mockState.user = { id: 1, role, companyId: 10 };
      mockState.pathname = '/finance/dashboard';
      const redirectHtml = renderToStaticMarkup(
        React.createElement(BillingAccessGuard, null, React.createElement('span', null, 'content'))
      );
      expect(redirectHtml).toContain('data-navigate="/billing"');

      mockState.pathname = '/billing';
      const allowedHtml = renderToStaticMarkup(
        React.createElement(BillingAccessGuard, null, React.createElement('span', null, 'billing-page'))
      );
      expect(allowedHtml).toContain('<span>billing-page</span>');
    }
  });

  it('при заблокированной подписке показывает экран блокировки для MANAGER и CASHIER', () => {
    mockState.queryData = { billingEnabled: true, accessAllowed: false };

    for (const role of ['MANAGER', 'CASHIER']) {
      mockState.user = { id: 2, role, companyId: 10 };
      mockState.pathname = '/billing';
      const html = renderToStaticMarkup(
        React.createElement(BillingAccessGuard, null, React.createElement('span', null, 'content'))
      );
      expect(html).toContain('billing.accessBlockedTitle');
      expect(html).not.toContain('<span>content</span>');
    }
  });

  it('показывает ссылку на оплату в мягком уведомлении и для ADMIN, и для ACCOUNTANT', () => {
    mockState.queryData = {
      billingEnabled: true,
      accessAllowed: true,
      paymentNoticeRequired: true,
    };
    mockState.visibleNotice = true;
    mockState.user = { id: 3, role: 'ACCOUNTANT', companyId: 10 };

    const html = renderToStaticMarkup(
      React.createElement(BillingAccessGuard, null, React.createElement('span', null, 'content'))
    );
    expect(html).toContain('data-notice-admin="true"');
    expect(html).toContain('data-notice-path="/billing"');
  });
});

