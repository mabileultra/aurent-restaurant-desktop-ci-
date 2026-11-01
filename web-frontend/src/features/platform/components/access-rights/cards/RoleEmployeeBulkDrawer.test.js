import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RoleEmployeeBulkDrawer from './RoleEmployeeBulkDrawer';

globalThis.React = React;

describe('RoleEmployeeBulkDrawer', () => {
  it('renders bulk drawer with disabled save button when not dirty', () => {
    const role = {
      code: 'CASHIER',
      name: 'Kassir',
      roleScope: new Set(['pos', 'catalog']),
      enabledModuleKeys: new Set(['pos']),
    };

    const html = renderToStaticMarkup(
      React.createElement(RoleEmployeeBulkDrawer, {
        isOpen: true,
        selectedUserIds: new Set(['u-1', 'u-2']),
        role,
        businessType: 'RESTAURANT',
        businessTypeName: 'Restoran',
        rawCatalog: [
          { id: 'pos', name: 'Kassa', group: 'pos' },
          { id: 'catalog', name: 'Katalog', group: 'catalog' },
        ],
        onClose: () => {},
        onSaved: () => {},
      })
    );

    expect(html).toContain('2 ta xodimga saqlash');
    // Save button should be disabled when nothing changed
    expect(html).toContain('disabled=""');
  });

  it('does not render anything when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(RoleEmployeeBulkDrawer, {
        isOpen: false,
        selectedUserIds: new Set(['u-1']),
        role: { code: 'CASHIER' },
      })
    );

    expect(html).toBe('');
  });
});
