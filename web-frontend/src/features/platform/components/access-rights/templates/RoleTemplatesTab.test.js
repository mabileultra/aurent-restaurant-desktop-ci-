import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RoleTemplatesTab from './RoleTemplatesTab';

globalThis.React = React;

describe('RoleTemplatesTab', () => {
  it('renders sidebar, role editor, and module groups', () => {
    const html = renderToStaticMarkup(React.createElement(RoleTemplatesTab));

    expect(html).toContain('Shablonlar · faoliyat turi › rol');
    expect(html).toContain('Restoran');
    expect(html).toContain('Dorixona');
    expect(html).toContain('Oziq-ovqat');
    expect(html).toContain('Boshqaruv paneli');
    expect(html).toContain('AI-assistent');
    expect(html).toContain('Ombor');
    expect(html).toContain('Moliya');
  });
});
