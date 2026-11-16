import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const hasModuleMock = vi.fn();
const mockAuthState = {
  user: { id: 1, role: 'ADMIN' },
};

vi.mock('react-router-dom', () => ({
  NavLink: ({ to, children }) => React.createElement('a', { href: to }, children),
}));

vi.mock('../../hooks/useModuleAccess', () => ({
  useModuleAccess: () => ({
    hasModule: (...args) => hasModuleMock(...args),
  }),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector) => selector(mockAuthState),
}));

vi.mock('../../store/cartStore', () => ({
  useCartStore: (selector) => selector({ parkedCarts: [] }),
}));

vi.mock('./pharmacyPosActions', () => ({
  usePharmacyPosActions: () => ({ run: vi.fn() }),
}));

import PharmacyPosTabs from './PharmacyPosTabs';

globalThis.React = React;

beforeEach(() => {
  mockAuthState.user = { id: 1, role: 'ADMIN' };
  hasModuleMock.mockReset();
});

describe('PharmacyPosTabs', () => {
  it('скрывает вкладки "Отчеты" и "Перемещение" для CASHIER даже при выданных модулях', () => {
    mockAuthState.user = { id: 2, role: 'CASHIER' };
    hasModuleMock.mockReturnValue(true);
    const html = renderToStaticMarkup(React.createElement(PharmacyPosTabs, { onOpenShift: vi.fn() }));

    expect(html).toContain('Чеки');
    expect(html).toContain('Смена');
    expect(html).not.toContain('Отчеты');
    expect(html).not.toContain('Перемещение');
  });

  it('скрывает вкладки "Отчеты" и "Перемещение" для роли без доступа к модулям', () => {
    mockAuthState.user = { id: 3, role: 'MANAGER' };
    hasModuleMock.mockReturnValue(false);
    const html = renderToStaticMarkup(React.createElement(PharmacyPosTabs, { onOpenShift: vi.fn() }));

    expect(html).toContain('Чеки');
    expect(html).toContain('Смена');
    expect(html).not.toContain('Отчеты');
    expect(html).not.toContain('Перемещение');
  });

  it('отображает вкладки "Отчеты" и "Перемещение" при наличии доступа к модулям (ADMIN/MANAGER)', () => {
    mockAuthState.user = { id: 1, role: 'ADMIN' };
    hasModuleMock.mockReturnValue(true);
    const html = renderToStaticMarkup(React.createElement(PharmacyPosTabs, { onOpenShift: vi.fn() }));

    expect(html).toContain('Отчеты');
    expect(html).toContain('Перемещение');
  });
});
