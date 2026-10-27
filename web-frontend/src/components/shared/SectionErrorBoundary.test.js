import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SectionErrorBoundary from './SectionErrorBoundary';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('../../observability/initSentry', () => ({
  Sentry: {
    captureException: vi.fn(),
  },
}));

function NormalComponent() {
  return React.createElement('div', { id: 'normal' }, 'Normal Content');
}

describe('SectionErrorBoundary', () => {
  it('renders children normally when there is no error', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        SectionErrorBoundary,
        { sectionName: 'test-section' },
        React.createElement(NormalComponent)
      )
    );

    expect(html).toContain('Normal Content');
  });

  it('renders fallback when state has error', () => {
    const boundary = new SectionErrorBoundary({ sectionName: 'test-section' });
    const derived = SectionErrorBoundary.getDerivedStateFromError(new Error('Crash in table'));
    expect(derived.hasError).toBe(true);

    boundary.state = derived;
    const rendered = boundary.render();
    const html = renderToStaticMarkup(rendered);

    expect(html).toContain('role="alert"');
    expect(html).toContain('Ma’lumotlarni yuklab bo‘lmadi');
  });

  it('renders custom function fallback if provided', () => {
    const boundary = new SectionErrorBoundary({
      sectionName: 'custom',
      fallback: ({ error }) => React.createElement('div', { className: 'custom-error' }, `Custom: ${error.message}`),
    });
    boundary.state = { hasError: true, error: new Error('Exploded') };

    const rendered = boundary.render();
    const html = renderToStaticMarkup(rendered);

    expect(html).toContain('custom-error');
    expect(html).toContain('Custom: Exploded');
  });
});
