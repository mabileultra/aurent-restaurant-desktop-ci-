import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformErrorState from './PlatformErrorState';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

describe('PlatformErrorState', () => {
  it('renders default error message and retry button', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformErrorState, {
        error: { message: 'Network failed', code: 'ERR_NETWORK' },
        onRetry: vi.fn(),
      })
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('Tarmoq xatosi');
    expect(html).toContain('Qayta urinish');
    expect(html).toContain('#ERR-NET-');
  });

  it('renders custom title, description, and action button', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformErrorState, {
        title: 'Maxsus xatolik',
        description: 'Tizimda nosozlik aniqlandi',
        size: 'sm',
        action: React.createElement('a', { href: '/support' }, 'Yordam'),
      })
    );

    expect(html).toContain('Maxsus xatolik');
    expect(html).toContain('Tizimda nosozlik aniqlandi');
    expect(html).toContain('href="/support"');
  });

  it('renders Sahifada xatolik yuz berdi and #ERR-UI- code for client runtime errors', () => {
    const runtimeErr = new ReferenceError("Cannot access 'broadcastMutation' before initialization");
    const html = renderToStaticMarkup(
      React.createElement(PlatformErrorState, {
        error: runtimeErr,
      })
    );

    expect(html).toContain('Sahifada xatolik yuz berdi');
    expect(html).toContain('#ERR-UI-');
    expect(html).not.toContain('#ERR-NET-');
  });
});
