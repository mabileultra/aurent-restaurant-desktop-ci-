import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AccessRightsAvatar from './AccessRightsAvatar';
import AccessRightsTriStateButton from './AccessRightsTriStateButton';
import AccessRightsStickyBar from './AccessRightsStickyBar';

globalThis.React = React;

describe('Access Rights Shared Components', () => {
  it('renders AccessRightsAvatar with initials correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsAvatar, { name: 'Dilnoza Rashidova' })
    );
    expect(html).toContain('DR');
  });

  it('renders AccessRightsTriStateButton with active mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsTriStateButton, { mode: 'grant', onChange: vi.fn() })
    );
    expect(html).toContain('Shablon');
    expect(html).toContain('Ruxsat');
    expect(html).toContain('Taqiq');
  });

  it('renders AccessRightsStickyBar with saved state and dirty state', () => {
    const cleanHtml = renderToStaticMarkup(
      React.createElement(AccessRightsStickyBar, { isDirty: false, onReset: vi.fn(), onSave: vi.fn() })
    );
    expect(cleanHtml).toContain('Barcha o‘zgarishlar saqlangan');

    const dirtyHtml = renderToStaticMarkup(
      React.createElement(AccessRightsStickyBar, { isDirty: true, dirtyCount: 3, onReset: vi.fn(), onSave: vi.fn() })
    );
    expect(dirtyHtml).toContain('3 ta o‘zgarish saqlanmagan');
  });
});
