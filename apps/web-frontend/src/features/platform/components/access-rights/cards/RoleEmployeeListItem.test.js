import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RoleEmployeeListItem from './RoleEmployeeListItem';

describe('RoleEmployeeListItem', () => {
  it('renders employee with template status and sozlash button', () => {
    const user = {
      id: 101,
      userId: 101,
      fullName: 'Ali Valiyev',
      username: 'ali',
      companyName: 'Choyxona #1',
      moduleAccessCustom: false,
    };

    const html = renderToStaticMarkup(
      React.createElement(RoleEmployeeListItem, {
        user,
        businessTypeName: 'Restoran',
        onResetClick: () => {},
        onEditClick: () => {},
      })
    );

    expect(html).toContain('Ali Valiyev');
    expect(html).toContain('ali');
    expect(html).toContain('Choyxona #1');
    expect(html).toContain('Shablon');
    expect(html).toContain('Sozlash');
    expect(html).not.toContain('Shablonga'); // Only for custom exceptions
  });

  it('renders employee with exception badge and shablonga button when moduleAccessCustom is true', () => {
    const user = {
      id: 102,
      userId: 102,
      fullName: 'Vali Aliyev',
      username: 'vali',
      moduleAccessCustom: true,
    };

    const html = renderToStaticMarkup(
      React.createElement(RoleEmployeeListItem, {
        user,
        businessTypeName: 'Restoran',
        onResetClick: () => {},
        onEditClick: () => {},
      })
    );

    expect(html).toContain('Vali Aliyev');
    expect(html).toContain('Istisno bor');
    expect(html).toContain('Sozlash');
    expect(html).toContain('Shablonga');
  });
});
