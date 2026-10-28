import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompanyFormModal from './PlatformCompanyFormModal';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (opts?.defaultValue) return opts.defaultValue;
      if (opts?.code) return `${key}:${opts.code}`;
      return key;
    },
    i18n: { language: 'uz' },
  }),
}));

vi.mock('../../shared/geo/RegionDistrictFields', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-region-district-fields' }),
}));

describe('PlatformCompanyFormModal', () => {
  const defaultBusinessTypes = [
    { id: 1, code: 'RETAIL', name: 'Roznitsa' },
    { id: 2, code: 'RESTAURANT', name: 'Restoran' },
  ];

  const defaultProps = {
    open: true,
    editing: null,
    form: {
      name: 'Test Market',
      legalName: 'Test Market MCHJ',
      tin: '123456789',
      address: 'Amir Temur ko‘chasi, 1',
      regionCode: 'TAS',
      districtCode: 'YUN',
      phone: '+998 (90) 123-45-67',
      active: true,
      businessType: 'RETAIL',
      businessTypeIds: [1],
      defaultBusinessTypeId: 1,
    },
    isSaving: false,
    businessTypes: defaultBusinessTypes,
    onClose: vi.fn(),
    onFieldChange: vi.fn(),
    onToggleBusinessType: vi.fn(),
    onSetDefaultBusinessType: vi.fn(),
    onSave: vi.fn(),
  };

  it('returns null when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyFormModal, { ...defaultProps, open: false })
    );
    expect(html).toBe('');
  });

  it('renders create modal with 2-column layout and business types', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyFormModal, defaultProps)
    );

    // Title & Hints
    expect(html).toContain('platform.addCompany');
    expect(html).toContain('platform.field_loginCodeAutoHint');

    // 2-column inputs
    expect(html).toContain('Test Market');
    expect(html).toContain('Test Market MCHJ');
    expect(html).toContain('123456789');
    expect(html).toContain('+998 (90) 123-45-67');

    // Geo fields component
    expect(html).toContain('data-testid="mock-region-district-fields"');

    // Business types selection & badges
    expect(html).toContain('RETAIL');
    expect(html).toContain('RESTAURANT');
    expect(html).toContain('★ platform.businessTypeDefault');

    // Default hint alert
    expect(html).toContain('platform.businessTypeDefaultHint:RETAIL');
  });

  it('renders edit modal with readonly login code block', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyFormModal, {
        ...defaultProps,
        editing: { id: 'comp-1', loginCode: 'TEST-007' },
      })
    );

    expect(html).toContain('platform.editCompany');
    expect(html).toContain('TEST-007');
    expect(html).toContain('platform.field_loginCodeReadonly');
    expect(html).not.toContain('platform.field_loginCodeAutoHint');
  });

  it('disables save button when required fields are missing', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyFormModal, {
        ...defaultProps,
        form: {
          ...defaultProps.form,
          name: '',
        },
      })
    );

    // When name is empty, save button has disabled attribute
    expect(html).toContain('disabled=""');
  });

  it('restricts tin input to max 9 numeric digits', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyFormModal, defaultProps)
    );

    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('maxLength="9"');
  });
});
