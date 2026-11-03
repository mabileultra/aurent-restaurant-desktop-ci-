import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FormDraftNotice from './FormDraftNotice';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
  }),
}));

describe('FormDraftNotice', () => {
  it('renders default notice message and clear action', () => {
    const onClear = vi.fn();
    const html = renderToStaticMarkup(
      React.createElement(FormDraftNotice, { onClear })
    );

    expect(html).toContain('Avvalgi kiritilgan ma’lumot tiklandi');
    expect(html).toContain('Tozalash');
  });

  it('renders without clear button when onClear is not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormDraftNotice, { onClear: null })
    );

    expect(html).toContain('Avvalgi kiritilgan ma’lumot tiklandi');
    expect(html).not.toContain('Tozalash');
  });
});
