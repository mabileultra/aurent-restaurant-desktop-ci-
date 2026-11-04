import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadDetailPane from './PlatformLeadDetailPane';

describe('PlatformLeadDetailPane', () => {
  it('renders lead details, status buttons and convert to company action', () => {
    const lead = {
      id: '1',
      name: 'Nodira Yusupova',
      phone: '+998 94 555 66 77',
      email: 'nodira.y@example.uz',
      status: 'IN_PROGRESS',
      leadType: 'CONNECT',
      source: 'pricing',
      message: 'Oziq-ovqat do\'koni',
      createdAt: '2026-10-27T16:15:00.000Z',
    };

    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadDetailPane, {
        lead,
        onStatusChange: vi.fn(),
        onAddComment: vi.fn(),
        onConvertToCompany: vi.fn(),
        onDeleteLead: vi.fn(),
      })
    );
    expect(html).toContain('Nodira Yusupova');
    expect(html).toContain('+998 94 555 66 77');
    expect(html).toContain('Kompaniyaga aylantirish');
    expect(html).toContain('Arizani o&#x27;chirish');
  });

  it('renders open company link instead of convert button when lead is already converted', () => {
    const lead = {
      id: '2',
      name: 'Jahongir Otajonov',
      phone: '+998 90 123 45 67',
      status: 'IN_PROGRESS',
      leadType: 'CONNECT',
      createdAt: '2026-10-27T16:15:00.000Z',
      managerNote: '[{"event":"CONVERTED_TO_COMPANY","note":"Kompaniya: «Jahongir Market» (ID: 88)"}]',
    };

    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadDetailPane, {
        lead,
        onStatusChange: vi.fn(),
        onAddComment: vi.fn(),
        onConvertToCompany: vi.fn(),
        onDeleteLead: vi.fn(),
      })
    );
    expect(html).toContain('Kompaniyani ochish (ID: 88)');
    expect(html).not.toContain('Kompaniyaga aylantirish');
    expect(html).toContain('/platform/companies?companyId=88');
  });
});
