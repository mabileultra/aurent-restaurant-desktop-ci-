import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useRoleEmployeesSelection } from './useRoleEmployeesSelection';

describe('useRoleEmployeesSelection', () => {
  it('initializes selection state safely inside a React component', () => {
    const users = [
      { id: 1, userId: 1, fullName: 'Ali' },
      { id: 2, userId: 2, fullName: 'Vali' },
    ];

    function TestComponent() {
      const { selectedUserIds, isAllSelected } = useRoleEmployeesSelection(users);
      return React.createElement(
        'div',
        null,
        `size:${selectedUserIds.size},isAll:${isAllSelected}`
      );
    }

    const html = renderToStaticMarkup(React.createElement(TestComponent));
    expect(html).toContain('size:0,isAll:false');
  });
});
