import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ADMIN_MODULE_IDS, CASHIER_MODULE_IDS } from '../../config/moduleHandbook';
import { resolveHasModule } from '../../utils/moduleAccessGate';

const mockAuthState = {
  token: 'jwt-token',
  user: { id: 1, role: 'ADMIN' },
  _hasHydrated: true,
};

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => React.createElement('div', { 'data-navigate': to }),
  Route: ({ children }) => React.createElement(React.Fragment, null, children),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector) => selector(mockAuthState),
}));

vi.mock('../../hooks/useModuleAccess', () => ({
  useModuleAccess: () => {
    const moduleDefs = [...ADMIN_MODULE_IDS, ...CASHIER_MODULE_IDS];
    const hasModule = (moduleId) => resolveHasModule({
      role: mockAuthState.user?.role,
      allowedModules: mockAuthState.user?.allowedModules,
      custom: mockAuthState.user?.moduleAccessCustom,
      moduleDefs,
      moduleId,
    });
    return {
      hasModule,
      hasAnyModule: (ids) => ids.some((id) => hasModule(id)),
    };
  },
}));

import { PharmacyHomeRedirect, PharmacyPosGuard, PharmacyRouteGuard } from './PharmacyRouteGuard';
import {
  BILLING_ALLOWED_ROLES,
  PHARMACY_REPORT_MODULES,
  canAccessBilling,
  resolvePharmacyHomePath,
} from './pharmacyRouteAccess';
import { PHARM_SALES_CHILDREN } from './pharmacyAdminNavConfig';
import { OFFICE_ROUTES } from './pharmacyOfficeRoutes';
import { REPORT_ROUTES } from './pharmacyReportRoutes';

globalThis.React = React;

const defaultHasModule = (user) => (moduleId) => resolveHasModule({
  role: user?.role,
  allowedModules: user?.allowedModules,
  custom: user?.moduleAccessCustom,
  moduleDefs: [...ADMIN_MODULE_IDS, ...CASHIER_MODULE_IDS],
  moduleId,
});

beforeEach(() => {
  mockAuthState.token = 'jwt-token';
  mockAuthState.user = { id: 1, role: 'ADMIN' };
  mockAuthState._hasHydrated = true;
});

describe('resolvePharmacyHomePath', () => {
  it('возвращает /dashboard для ADMIN, /finance/dashboard для ACCOUNTANT и /pos для CASHIER', () => {
    expect(resolvePharmacyHomePath({ role: 'ADMIN' }, defaultHasModule({ role: 'ADMIN' }))).toBe('/dashboard');
    expect(resolvePharmacyHomePath({ role: 'ACCOUNTANT' }, defaultHasModule({ role: 'ACCOUNTANT' }))).toBe('/finance/dashboard');
    expect(resolvePharmacyHomePath({ role: 'CASHIER' }, defaultHasModule({ role: 'CASHIER' }))).toBe('/pos');
  });

  it('выбирает первый доступный модуль при custom ACL без dashboard и не уходит в цикл', () => {
    const customManager = {
      role: 'MANAGER',
      moduleAccessCustom: true,
      allowedModules: ['stockProducts'],
    };
    expect(resolvePharmacyHomePath(customManager, defaultHasModule(customManager))).toBe('/stock/products');

    const emptyManager = {
      role: 'MANAGER',
      moduleAccessCustom: true,
      allowedModules: [],
    };
    expect(resolvePharmacyHomePath(emptyManager, defaultHasModule(emptyManager))).toBe('/handbook');
  });
});

describe('PharmacyRouteGuard', () => {
  it('пропускает ADMIN и ACCOUNTANT на /billing и блокирует MANAGER', () => {
    mockAuthState.user = { id: 1, role: 'ADMIN' };
    const adminHtml = renderToStaticMarkup(
      React.createElement(PharmacyRouteGuard, { roles: BILLING_ALLOWED_ROLES }, React.createElement('span', null, 'billing'))
    );
    expect(adminHtml).toContain('<span>billing</span>');

    mockAuthState.user = { id: 2, role: 'ACCOUNTANT' };
    const accountantHtml = renderToStaticMarkup(
      React.createElement(PharmacyRouteGuard, { roles: BILLING_ALLOWED_ROLES }, React.createElement('span', null, 'billing'))
    );
    expect(accountantHtml).toContain('<span>billing</span>');

    mockAuthState.user = { id: 3, role: 'MANAGER' };
    const managerHtml = renderToStaticMarkup(
      React.createElement(PharmacyRouteGuard, { roles: BILLING_ALLOWED_ROLES }, React.createElement('span', null, 'billing'))
    );
    expect(managerHtml).toContain('data-navigate="/dashboard"');
  });

  it('редиректит CASHIER на /pos даже при moduleAccessCustom с выданным модулем', () => {
    mockAuthState.user = {
      id: 4,
      role: 'CASHIER',
      moduleAccessCustom: true,
      allowedModules: ['reportsSalesDaily', 'stockTransfers'],
    };
    const html = renderToStaticMarkup(
      React.createElement(PharmacyRouteGuard, { module: 'reportsSalesDaily' }, React.createElement('span', null, 'report'))
    );
    expect(html).toContain('data-navigate="/pos"');
  });

  it('проверяет moduleAccessCustom и перенаправляет ACCOUNTANT на /finance/dashboard при отказе', () => {
    mockAuthState.user = { id: 2, role: 'ACCOUNTANT' };
    const deniedHtml = renderToStaticMarkup(
      React.createElement(PharmacyRouteGuard, { module: 'usersList' }, React.createElement('span', null, 'users'))
    );
    expect(deniedHtml).toContain('data-navigate="/finance/dashboard"');

    mockAuthState.user = {
      id: 3,
      role: 'MANAGER',
      moduleAccessCustom: true,
      allowedModules: ['dashboard', 'usersList'],
    };
    const grantedHtml = renderToStaticMarkup(
      React.createElement(PharmacyRouteGuard, { module: 'usersList' }, React.createElement('span', null, 'users'))
    );
    expect(grantedHtml).toContain('<span>users</span>');
  });

  it('проверяет anyModules для хаба отчётов', () => {
    mockAuthState.user = {
      id: 3,
      role: 'MANAGER',
      moduleAccessCustom: true,
      allowedModules: ['dashboard', 'reportsStockLow'],
    };
    const allowedHtml = renderToStaticMarkup(
      React.createElement(PharmacyRouteGuard, { anyModules: PHARMACY_REPORT_MODULES }, React.createElement('span', null, 'hub'))
    );
    expect(allowedHtml).toContain('<span>hub</span>');

    mockAuthState.user = {
      id: 3,
      role: 'MANAGER',
      moduleAccessCustom: true,
      allowedModules: ['dashboard'],
    };
    const deniedHtml = renderToStaticMarkup(
      React.createElement(PharmacyRouteGuard, { anyModules: PHARMACY_REPORT_MODULES }, React.createElement('span', null, 'hub'))
    );
    expect(deniedHtml).toContain('data-navigate="/dashboard"');
  });
});

describe('PharmacyPosGuard and PharmacyHomeRedirect', () => {
  it('не пускает ACCOUNTANT на /pos без cashierPos и перенаправляет в /finance/dashboard', () => {
    mockAuthState.user = { id: 2, role: 'ACCOUNTANT' };
    const html = renderToStaticMarkup(
      React.createElement(PharmacyPosGuard, null, React.createElement('span', null, 'pos'))
    );
    expect(html).toContain('data-navigate="/finance/dashboard"');
  });

  it('пускает CASHIER, MANAGER и ADMIN на /pos', () => {
    for (const role of ['CASHIER', 'MANAGER', 'ADMIN']) {
      mockAuthState.user = { id: 1, role };
      const html = renderToStaticMarkup(
        React.createElement(PharmacyPosGuard, null, React.createElement('span', null, 'pos'))
      );
      expect(html).toContain('<span>pos</span>');
    }
  });

  it('PharmacyHomeRedirect отправляет неавторизованного на /login и ACCOUNTANT на /finance/dashboard', () => {
    mockAuthState.token = null;
    const unauthHtml = renderToStaticMarkup(React.createElement(PharmacyHomeRedirect));
    expect(unauthHtml).toContain('data-navigate="/login"');

    mockAuthState.token = 'jwt-token';
    mockAuthState.user = { id: 2, role: 'ACCOUNTANT' };
    const accountantHtml = renderToStaticMarkup(React.createElement(PharmacyHomeRedirect));
    expect(accountantHtml).toContain('data-navigate="/finance/dashboard"');
  });
});

describe('Pharmacy routes and navigation config integrity', () => {
  it('каждый маршрут в OFFICE_ROUTES и REPORT_ROUTES защищён module, anyModules или roles', () => {
    for (const route of [...OFFICE_ROUTES, ...REPORT_ROUTES]) {
      const hasGuard = Boolean(route.module || route.anyModules?.length || route.roles?.length);
      expect(hasGuard, `Missing guard for ${route.path}`).toBe(true);
    }
    const billingRoute = OFFICE_ROUTES.find((r) => r.path === '/billing');
    expect(billingRoute?.roles).toEqual(['ADMIN', 'ACCOUNTANT']);
  });

  it('PHARM_SALES_CHILDREN привязан к модулям продаж и возвратов, а биллинг открыт только ADMIN и ACCOUNTANT', () => {
    expect(PHARM_SALES_CHILDREN[0].anyModules).toEqual(['cashierSales', 'reportsSales', 'reportsSalesDaily']);
    expect(PHARM_SALES_CHILDREN[1].moduleId).toBe('reportsReturns');
    expect(canAccessBilling('ADMIN')).toBe(true);
    expect(canAccessBilling('ACCOUNTANT')).toBe(true);
    expect(canAccessBilling('MANAGER')).toBe(false);
    expect(canAccessBilling('CASHIER')).toBe(false);
  });

  it('пускает ADMIN с аптечным moduleAccessCustom на /sales при наличии reportsSalesDaily', () => {
    mockAuthState.user = {
      id: 1,
      role: 'ADMIN',
      moduleAccessCustom: true,
      allowedModules: ['dashboard', 'reportsSalesDaily'],
    };
    const adminHtml = renderToStaticMarkup(
      React.createElement(
        PharmacyRouteGuard,
        { anyModules: PHARM_SALES_CHILDREN[0].anyModules },
        React.createElement('span', null, 'sales')
      )
    );
    expect(adminHtml).toContain('<span>sales</span>');

    mockAuthState.user = { id: 2, role: 'ACCOUNTANT' };
    const accountantHtml = renderToStaticMarkup(
      React.createElement(
        PharmacyRouteGuard,
        { anyModules: PHARM_SALES_CHILDREN[0].anyModules },
        React.createElement('span', null, 'sales')
      )
    );
    expect(accountantHtml).toContain('data-navigate="/finance/dashboard"');
  });
});

