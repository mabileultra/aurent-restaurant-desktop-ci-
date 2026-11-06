import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadsHeaderAlert from './PlatformLeadsHeaderAlert';

describe('PlatformLeadsHeaderAlert', () => {
  it('renders nothing when count is 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadsHeaderAlert, { unansweredCount: 0 })
    );
    expect(html).toBe('');
  });

  it('renders alert when count > 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadsHeaderAlert, {
        unansweredCount: 2,
        t: (_, { defaultValue }) => defaultValue,
      })
    );
    expect(html).toContain('2 ta yangi ariza 1 kundan ortiq javobsiz turibdi');
  });
});
