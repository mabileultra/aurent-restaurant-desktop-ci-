import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('react-router-dom', () => ({
  Link: ({ to, className, children }) => React.createElement('a', { href: to, className }, children),
  NavLink: ({ to, className, children }) =>
    React.createElement(
      'a',
      { href: to, className: typeof className === 'function' ? className({ isActive: false }) : className },
      children
    ),
}));

vi.mock('../../hooks/useModuleAccess', () => ({
  useModuleAccess: () => ({ hasModule: () => true }),
}));

vi.mock('../../store/cartStore', () => ({
  useCartStore: (selector) => selector({ parkedCarts: [] }),
}));

vi.mock('./pharmacyPosActions', () => ({
  usePharmacyPosActions: () => ({ run: vi.fn() }),
}));

import PharmacyPosTopbar from './PharmacyPosTopbar';

globalThis.React = React;

describe('PharmacyPosTopbar', () => {
  it('отображает кнопку "В кабинет" (/dashboard) для ADMIN/MANAGER (canOpenOffice=true)', () => {
    const html = renderToStaticMarkup(
      React.createElement(PharmacyPosTopbar, {
        storeName: 'Аптека №1',
        shift: { registerNumber: 2 },
        shiftOpenBadge: 'Смена открыта',
        cashierName: 'Админ',
        canOpenOffice: true,
        openShift: vi.fn(),
        onLogout: vi.fn(),
      })
    );

    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('В кабинет');
    expect(html).toContain('Касса №2');
  });

  it('скрывает кнопку "В кабинет" для CASHIER (canOpenOffice=false)', () => {
    const html = renderToStaticMarkup(
      React.createElement(PharmacyPosTopbar, {
        storeName: 'Аптека №1',
        shift: { registerNumber: 2 },
        shiftOpenBadge: 'Смена открыта',
        cashierName: 'Кассир',
        canOpenOffice: false,
        openShift: vi.fn(),
        onLogout: vi.fn(),
      })
    );

    expect(html).not.toContain('В кабинет');
    expect(html).not.toContain('href="/dashboard"');
  });
});

