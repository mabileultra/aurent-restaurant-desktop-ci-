import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StoreFormModal from './StoreFormModal';

globalThis.React = React;

const translations = {
  'productTemplates.businessTypes.GROCERY': 'Oziq-ovqat',
  'productTemplates.businessTypes.RESTAURANT': 'Restoran',
  'productTemplates.businessTypes.UNIVERSAL': 'Universal / gipermarket',
  'validation.fieldRequired': 'Majburiy maydon',
  'stores.colName': 'Nomi',
  'stores.colCompany': 'Kompaniya',
  'stores.colBusinessType': 'Filial turi',
  'stores.colAddress': 'Manzil',
  'stores.colPhone': 'Telefon',
  'stores.editTitle': 'Do‘konni tahrirlash',
  'platform.addBranch': 'Filial qo‘shish',
  'stores.addTitle': 'Do‘kon qo‘shish',
  'stores.selectCompanyFirst': 'Avval kompaniyani tanlang',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => translations[key] || opts?.defaultValue || key,
  }),
}));

vi.mock('../../../../hooks/useStoreFormBusinessTypes', () => ({
  useStoreFormBusinessTypes: () => ({
    types: [
      { id: 1, code: 'GROCERY', name: 'Продукты' }, // backend Russian name
      { id: 2, code: 'RESTAURANT', name: 'Ресторан' },
    ],
    defaultTypeCode: 'GROCERY',
    isLoading: false,
    needsCompany: false,
  }),
}));

vi.mock('../../../shared/geo/RegionDistrictFields', () => ({
  default: () => React.createElement('div', { 'data-testid': 'region-district-fields' }),
}));

describe('StoreFormModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isPending: false,
    showCompanySelect: true,
    companies: [{ id: 1, name: 'Test Kompaniya' }],
  };

  it('renders nothing when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreFormModal, { ...defaultProps, open: false })
    );
    expect(html).toBe('');
  });

  it('renders full-screen backdrop with z-[1000] and bg-black/60 when open is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreFormModal, defaultProps)
    );

    // Fullscreen backdrop must have fixed inset-0 z-[1000] bg-black/60
    expect(html).toContain('fixed inset-0 z-[1000]');
    expect(html).toContain('bg-black/60');

    // Title should be Filial qo‘shish
    expect(html).toContain('Filial qo‘shish');
  });

  it('translates business types using i18n instead of raw backend name', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreFormModal, defaultProps)
    );

    // Should contain Uzbek translation "Oziq-ovqat"
    expect(html).toContain('Oziq-ovqat');
    // Should NOT contain raw Russian backend string "Продукты"
    expect(html).not.toContain('Продукты');
  });

  it('renders phone input with tel inputMode and +998 mask placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreFormModal, defaultProps)
    );

    expect(html).toContain('type="tel"');
    expect(html).toContain('inputMode="tel"');
    expect(html).toContain('placeholder="+998 (90) 123-45-67"');
    expect(html).toContain('maxLength="19"');
  });

  it('formats initial phone with Uzbek mask when editing', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreFormModal, {
        ...defaultProps,
        initial: {
          id: 5,
          name: 'Mavjud filial',
          businessType: 'GROCERY',
          phone: '998901234567',
        },
      })
    );

    expect(html).toContain('Do‘konni tahrirlash');
    expect(html).toContain('+998 (90) 123-45-67');
  });
});
