import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

let currentLang = 'ru';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts = {}) => {
      if (key === 'productTemplates.businessTypes.PHARMACY') {
        return currentLang === 'uz' ? 'Dorixona' : 'Аптека';
      }
      if (key === 'pos.registerNumber') {
        return currentLang === 'uz' ? `Kassa №${opts.no}` : `Касса №${opts.no}`;
      }
      if (key === 'nav.office') {
        return currentLang === 'uz' ? 'Kabinetga' : 'В кабинет';
      }
      if (key === 'nav.logout') {
        return currentLang === 'uz' ? 'Chiqish' : 'Выход';
      }
      return opts.defaultValue || key;
    },
  }),
}));

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

  it('til o‘zbekcha bo‘lganda "Dorixona", "Kassa №2" va "Kabinetga" aks etadi', () => {
    currentLang = 'uz';
    const html = renderToStaticMarkup(
      React.createElement(PharmacyPosTopbar, {
        storeName: 'Dorixona №1',
        shift: { registerNumber: 2 },
        shiftOpenBadge: 'Smena ochiq',
        cashierName: 'Kassir',
        canOpenOffice: true,
        openShift: vi.fn(),
        onLogout: vi.fn(),
      })
    );

    expect(html).toContain('Dorixona');
    expect(html).not.toContain('Аптека');
    expect(html).toContain('Kassa №2');
    expect(html).toContain('Kabinetga');
    expect(html).toContain('Chiqish');
    currentLang = 'ru';
  });
});

