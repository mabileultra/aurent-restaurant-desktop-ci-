import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ObservabilityErrorBoundary from './ObservabilityErrorBoundary';

globalThis.React = React;

vi.mock('./initSentry', () => ({
  Sentry: {
    captureException: vi.fn(),
  },
}));

describe('ObservabilityErrorBoundary', () => {
  it('renders children when there is no error', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ObservabilityErrorBoundary,
        null,
        React.createElement('div', { id: 'child' }, 'Working Content')
      )
    );
    expect(html).toContain('Working Content');
  });

  it('renders full-screen error alert with formatted errCode on runtime crash', () => {
    vi.stubGlobal('navigator', { onLine: true });
    const boundary = new ObservabilityErrorBoundary({});
    const err = new TypeError("Cannot read properties of null (reading 'useContext')");
    const derived = ObservabilityErrorBoundary.getDerivedStateFromError(err);
    derived.isOffline = false;
    boundary.state = derived;

    const rendered = boundary.render();
    const html = renderToStaticMarkup(rendered);

    expect(html).toContain('role="alert"');
    expect(html).toContain('Tizimda kutilmagan xatolik yuz berdi');
    expect(html).toContain('#ERR-UI-57FB');
  });

  it('renders offline message when network is disconnected', () => {
    const boundary = new ObservabilityErrorBoundary({});
    boundary.state = {
      hasError: true,
      error: new Error('Network failed'),
      isOffline: true,
      chunk: false,
      reloadSkipped: false,
    };

    const rendered = boundary.render();
    const html = renderToStaticMarkup(rendered);

    expect(html).toContain('Internet bilan aloqa uzildi');
  });
});
