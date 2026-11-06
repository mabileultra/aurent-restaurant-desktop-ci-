import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AccessRightsCopyCandidateItem from './AccessRightsCopyCandidateItem';

describe('AccessRightsCopyCandidateItem', () => {
  it('renders matching role candidate with localized role', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsCopyCandidateItem, {
        user: { id: 'u1', fullName: 'Alisher Karimov', role: 'ADMIN' },
        isChecked: false,
        isSameRole: true,
        sourceRole: 'ADMIN',
      })
    );

    expect(html).toContain('Alisher Karimov');
    expect(html).toContain('Admin');
  });

  it('renders role mismatch warning when roles do not match', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsCopyCandidateItem, {
        user: { id: 'u2', fullName: 'Malika Karimova', role: 'CASHIER' },
        isChecked: false,
        isSameRole: false,
        sourceRole: 'ADMIN',
      })
    );

    expect(html).toContain('Malika Karimova');
    expect(html).toContain('Rol mos emas');
  });
});
