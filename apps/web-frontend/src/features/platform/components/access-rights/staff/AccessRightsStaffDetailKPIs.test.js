import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AccessRightsStaffDetailKPIs from './AccessRightsStaffDetailKPIs';

describe('AccessRightsStaffDetailKPIs', () => {
  it('renders all 4 metric values correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsStaffDetailKPIs, {
        templateCount: 15,
        addedCount: 3,
        blockedCount: 1,
        finalCount: 17,
      })
    );

    expect(html).toContain('15 modul');
    expect(html).toContain('+3');
    expect(html).toContain('−1');
    expect(html).toContain('17 modul');
  });
});
