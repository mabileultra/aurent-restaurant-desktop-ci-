import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecurityStaffFlow } from './useSecurityStaffFlow';

globalThis.React = React;

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false, isPending: false }),
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
    expect(state.staffList.length).toBeGreaterThan(0);
    expect(state.currentTempPassword).toBeTruthy();

    state.openCreate();
    state.updateField('firstName', 'Shahzod');
    state.cycleTempPassword();
    state.closeForm();
  });
});
