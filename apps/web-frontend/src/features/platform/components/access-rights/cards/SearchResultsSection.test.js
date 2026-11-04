import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SearchResultsSection from './SearchResultsSection';

globalThis.React = React;

describe('SearchResultsSection', () => {
  it('renders search results with employee name, company, role, and business type badge', () => {
    const users = [
      {
        userId: 'u-1',
        fullName: 'Umid Aliyev',
        username: 'umid_grocery',
        role: 'ADMIN',
        companyName: 'Raimbobo Market',
        businessType: 'GROCERY',
        businessTypeName: 'Oziq-ovqat',
        moduleAccessCustom: true,
      },
      {
        userId: 'u-2',
        fullName: 'Umid Karimov',
        username: 'umid_rest',
        role: 'CASHIER',
        companyName: 'Osh Markazi',
        businessType: 'RESTAURANT',
        businessTypeName: 'Restoran',
        moduleAccessCustom: false,
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(SearchResultsSection, {
        searchTerm: 'Umid',
        users,
        currentLang: 'uz',
        onEditUser: () => {},
        onResetUser: () => {},
      })
    );

    expect(html).toContain('«Umid» bo‘yicha 2 ta xodim topildi');
    expect(html).toContain('Umid Aliyev');
    expect(html).toContain('Raimbobo Market');
    expect(html).toContain('Oziq-ovqat');
    expect(html).toContain('Istisno bor');
    expect(html).toContain('Umid Karimov');
    expect(html).toContain('Osh Markazi');
    expect(html).toContain('Restoran');
    expect(html).toContain('Shablon');
  });

  it('renders empty message when no users match search', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchResultsSection, {
        searchTerm: 'Noma\'lum',
        users: [],
        currentLang: 'uz',
      })
    );

    expect(html).toContain('«Noma&#x27;lum» bo‘yicha hech qanday xodim topilmadi');
  });
});
