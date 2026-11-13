import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlatformCompanyFormModal from './PlatformCompanyFormModal';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('../../../api/geo.api', () => ({
  geoApi: {
    regions: vi.fn().mockResolvedValue({
      data: [{ code: 'TAS', nameUz: 'Toshkent shahri' }],
    }),
    districts: vi.fn().mockResolvedValue({
      data: [{ code: 'YUN', nameUz: 'Yunusobod tumani' }],
    }),
  },
}));

describe('PlatformCompanyFormModal', () => {
  const qc = new QueryClient();

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
      businessTypeIds: [1, 2],
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

  const renderModal = (props) =>
    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(PlatformCompanyFormModal, props)
      )
    );

  it('returns null when open is false', () => {
    const html = renderModal({ ...defaultProps, open: false });
    expect(html).toBe('');
  });

  it('renders create modal with 2-column layout and business types', () => {
    const html = renderModal(defaultProps);

    // Title & Hints
    expect(html).toContain('Kompaniya qo‘shish');
    expect(html).toContain('Kompaniya ma’lumotlari va faoliyat turlari');
    expect(html).toContain('Kirish kodi saqlangandan keyin avtomatik beriladi');

    // Inputs
    expect(html).toContain('Test Market');
    expect(html).toContain('Test Market MCHJ');
    expect(html).toContain('123456789');
    expect(html).toContain('+998 (90) 123-45-67');

    // Business types
    expect(html).toContain('Roznitsa');
    expect(html).toContain('Restoran');
    expect(html).toContain('Asosiy');
    expect(html).toContain('Asosiy qilish');
  });

  it('renders edit modal with subtitle containing id and loginCode', () => {
    const html = renderModal({
      ...defaultProps,
      editing: { id: 'comp-1', loginCode: 'TEST-007' },
    });

    expect(html).toContain('Kompaniyani tahrirlash');
    expect(html).toContain('ID comp-1 · kirish kodi TEST-007');
    expect(html).not.toContain('Kirish kodi saqlangandan keyin avtomatik beriladi');
  });
});
