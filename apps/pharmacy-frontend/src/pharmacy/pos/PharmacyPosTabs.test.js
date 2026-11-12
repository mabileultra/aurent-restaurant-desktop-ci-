import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const hasModuleMock = vi.fn();

vi.mock('react-router-dom', () => ({
  NavLink: ({ to, children }) => React.createElement('a', { href: to }, children),
}));

vi.mock('../../hooks/useModuleAccess', () => ({
  useModuleAccess: () => ({
    hasModule: (...args) => hasModuleMock(...args),
  }),
}));

vi.mock('../../store/cartStore', () => ({
  useCartStore: (selector) => selector({ parkedCarts: [] }),
}));

vi.mock('./pharmacyPosActions', () => ({
  usePharmacyPosActions: () => ({ run: vi.fn() }),
}));

import PharmacyPosTabs from './PharmacyPosTabs';

globalThis.React = React;

describe('PharmacyPosTabs', () => {
  it('скрывает вкладки "Отчеты" и "Перемещение" для роли без доступа к reports/stock (CASHIER)', () => {
    hasModuleMock.mockReturnValue(false);
    const html = renderToStaticMarkup(React.createElement(PharmacyPosTabs, { onOpenShift: vi.fn() }));

    expect(html).toContain('Чеки');
    expect(html).toContain('Смена');
    expect(html).not.toContain('Отчеты');
    expect(html).not.toContain('Перемещение');
  });

  it('отображает вкладки "Отчеты" и "Перемещение" при наличии доступа к модулям (ADMIN/MANAGER)', () => {
    hasModuleMock.mockReturnValue(true);
    const html = renderToStaticMarkup(React.createElement(PharmacyPosTabs, { onOpenShift: vi.fn() }));

    expect(html).toContain('Отчеты');
    expect(html).toContain('Перемещение');
  });
});

