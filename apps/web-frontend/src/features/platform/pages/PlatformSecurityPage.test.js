import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformSecurityPage from './PlatformSecurityPage';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false, isPending: false }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

describe('PlatformSecurityPage', () => {
  it('renders the security page with header, tabs and overview content', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/platform/security'] },
        React.createElement(PlatformSecurityPage)
      )
    );

    expect(html).toContain('Xavfsizlik');
    expect(html).toContain('Umumiy holat');
    expect(html).toContain('Kirishlar va seanslar');
    expect(html).toContain('Harakatlar jurnali');
    expect(html).toContain('Xodimlar');
    expect(html).toContain('Kirish qoidalari');
    expect(html).toContain('Faol seanslar');
    expect(html).toContain('Diqqat talab qiladi');
    expect(html).toContain('Tavsiyalar');
  });
});
