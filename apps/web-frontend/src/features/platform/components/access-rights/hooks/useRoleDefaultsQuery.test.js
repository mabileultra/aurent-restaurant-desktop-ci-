import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolveSampleUserByRole, useRoleDefaultsQuery } from './useRoleDefaultsQuery';

vi.mock('../../../../../api', () => ({
  platformModuleAccessApi: {
    getUser: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: {} })),
}));

describe('useRoleDefaultsQuery & resolveSampleUserByRole', () => {
  it('prefers employee without custom exceptions for representative sample', () => {
    const rawUsers = [
      { userId: 'u1', role: 'MANAGER', moduleAccessCustom: true },
      { userId: 'u2', role: 'MANAGER', moduleAccessCustom: false },
      { userId: 'u3', role: 'CASHIER', moduleAccessCustom: true },
    ];

    const sample = resolveSampleUserByRole(rawUsers);
    expect(sample.MANAGER.userId).toBe('u2');
    expect(sample.CASHIER.userId).toBe('u3');
  });

  it('runs hook safely inside a React component', () => {
    function TestComponent() {
      const data = useRoleDefaultsQuery([]);
      return React.createElement('div', null, JSON.stringify(data));
    }

    const html = renderToStaticMarkup(React.createElement(TestComponent));
    expect(html).toContain('{}');
  });
});
