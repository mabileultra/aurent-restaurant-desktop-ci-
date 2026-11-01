import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PermissionHistoryTab from './PermissionHistoryTab';

globalThis.React = React;

describe('PermissionHistoryTab', () => {
  it('renders history entries and rollback action buttons', () => {
    const html = renderToStaticMarkup(React.createElement(PermissionHistoryTab));

    expect(html).toContain('Administrator Super');
    expect(html).toContain('Qaytarish');
    expect(html).toContain('Tafsilot');
    expect(html).toContain('Barcha amallar');
  });
});
