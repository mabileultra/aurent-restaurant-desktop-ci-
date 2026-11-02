import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadMobileDetailView from './PlatformLeadMobileDetailView';

describe('PlatformLeadMobileDetailView', () => {
  it('renders mobile layout with call button and back header', () => {
    const lead = {
      id: '2',
      name: 'Sherzod Toshmatov',
      phone: '+998 93 222 33 44',
      status: 'NEW',
      leadType: 'CONNECT',
      source: 'hero',
      message: 'Restoran ochyapmiz, 12 ta stol',
      createdAt: '2026-11-01T13:05:00.000Z',
    };

    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadMobileDetailView, {
        lead,
        onBack: vi.fn(),
        onStatusChange: vi.fn(),
        onAddComment: vi.fn(),
        onConvertToCompany: vi.fn(),
      })
    );
    expect(html).toContain('Sherzod Toshmatov');
    expect(html).toContain('+998 93 222 33 44 ga qo&#x27;ng&#x27;iroq');
    expect(html).toContain('Kompaniyaga aylantirish');
  });
});
