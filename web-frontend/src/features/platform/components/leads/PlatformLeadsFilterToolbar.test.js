import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadsFilterToolbar from './PlatformLeadsFilterToolbar';

describe('PlatformLeadsFilterToolbar', () => {
  it('renders status counts and search input', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadsFilterToolbar, {
        status: '',
        onStatusChange: vi.fn(),
        counts: { ALL: 7, NEW: 3, IN_PROGRESS: 2, DONE: 1, REJECTED: 1 },
        search: '',
        onSearchChange: vi.fn(),
        leadType: '',
        onTypeChange: vi.fn(),
      })
    );
    expect(html).toContain('Hammasi');
    expect(html).toContain('7');
    expect(html).toContain('Yangi');
    expect(html).toContain('3');
    expect(html).toContain('Barcha turlar');
  });
});
