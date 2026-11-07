import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformEmailPage from './PlatformEmailPage';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({ data: null, isPending: false }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

describe('PlatformEmailPage', () => {
  it('renders the email page with header and tabs nav', () => {
    const html = renderToStaticMarkup(React.createElement(PlatformEmailPage));

    expect(html).toContain('Pochta');
    expect(html).toContain('Yuborish');
    expect(html).toContain('Tarix');
    expect(html).toContain('Avtomatik xatlar');
    expect(html).toContain('Sozlamalar');
    expect(html).toContain('Yangi xabar');
    expect(html).toContain('Ko‘rinish');
  });
});
