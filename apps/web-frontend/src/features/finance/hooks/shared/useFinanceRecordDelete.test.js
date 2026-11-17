// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFinanceSelectableRows } from './useFinanceRecordDelete';

describe('useFinanceRecordDelete & selectables', () => {
  it('computes selectable and deletable rows', () => {
    const rows = [
      { id: '1', editable: true },
      { id: '2', editable: false },
    ];
    const isEditable = (r) => r.editable;
    const selection = {
      selectedRows: [rows[0]],
      selectedIds: new Set(['1']),
      setSelectedIds: vi.fn(),
    };

    const { result } = renderHook(() =>
      useFinanceSelectableRows(rows, isEditable, selection)
    );

    expect(result.current.selectableRows).toHaveLength(1);
    expect(result.current.selectedDeletable).toHaveLength(1);
    expect(result.current.allSelectableSelected).toBe(true);

    act(() => {
      result.current.toggleSelectAllEditable();
    });
    expect(selection.setSelectedIds).toHaveBeenCalled();
  });
});
