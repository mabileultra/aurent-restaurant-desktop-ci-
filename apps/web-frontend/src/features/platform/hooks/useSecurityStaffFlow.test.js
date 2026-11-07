import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecurityStaffFlow } from './useSecurityStaffFlow';

globalThis.React = React;

const mockAdmins = [
  {
    id: 'admin-1',
    username: 'superadmin',
    email: 'admin@aurent.uz',
    firstName: 'Super',
    lastName: 'Admin',
    fullName: 'Super Admin',
    role: 'SUPER_ADMIN',
    active: true,
  },
];

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({ data: mockAdmins, isLoading: false, isPending: false }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

describe('useSecurityStaffFlow', () => {
  it('manages staff drawer state and form updates', () => {
    let state;
    function TestComponent() {
      state = useSecurityStaffFlow();
      return React.createElement('div', null, state.staffList.length);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.form).toBeNull();
    expect(state.staffList.length).toBe(1);
    expect(state.staffList[0].username).toBe('superadmin');
    expect(state.staffList[0].active).toBe(true);
    expect(state.currentTempPassword).toBeTruthy();

    state.openCreate();
    state.updateField('firstName', 'Shahzod');
    state.cycleTempPassword();
    state.closeForm();
  });
});
