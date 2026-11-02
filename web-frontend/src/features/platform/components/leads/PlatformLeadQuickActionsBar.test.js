import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadQuickActionsBar from './PlatformLeadQuickActionsBar';

describe('PlatformLeadQuickActionsBar', () => {
  it('renders quick call, telegram, email and copy buttons', () => {
    const lead = {
      phone: '+998 94 555 66 77',
      email: 'test@example.uz',
    };

    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadQuickActionsBar, { lead })
    );
    expect(html).toContain('tel:+998945556677');
    expect(html).toContain('Telegram');
    expect(html).toContain('Email');
    expect(html).toContain('Raqamni nusxalash');
  });
});
