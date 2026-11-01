import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformModuleAccessToolbar from './PlatformModuleAccessToolbar';

describe('PlatformModuleAccessToolbar', () => {
  it('renders search input, filter tabs and company selector', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformModuleAccessToolbar, {
        searchTerm: 'admin',
        setSearchTerm: () => {},
        accessFilter: 'unconfigured',
        setAccessFilter: () => {},
        unconfiguredCount: 5,
        isPlatformStaff: false,
        companies: [{ id: 1, name: 'Choyxona #1' }],
        companiesLoading: false,
        selectedCompanyId: '',
        setSelectedCompanyId: () => {},
        currentLang: 'uz',
        isTruncated: true,
        totalCount: 300,
        loadedCount: 250,
      })
    );

    expect(html).toContain('Ism, login yoki kompaniya bo‘yicha qidiruv...');
    expect(html).toContain('Sozlanmagan (5)');
    expect(html).toContain('Dastlabki 250 ta xodim ko‘rsatilmoqda (Jami: 300 ta)');
  });
});
