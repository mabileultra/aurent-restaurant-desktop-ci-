import { useEffect, useMemo, useRef, useState } from 'react';

export function usePharmacyRowSelection(pageRows, resetKey) {
  const [selected, setSelected] = useState(() => new Map());
  const selectAllRef = useRef(null);
  const rows = Array.isArray(pageRows) ? pageRows : [];
  const pageIds = useMemo(() => rows.map((r) => r.id).filter(Boolean), [rows]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected = pageIds.some((id) => selected.has(id));

  useEffect(() => {
    setSelected(new Map());
  }, [resetKey]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  const toggleSelect = (row) => {
    if (!row?.id) return;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.set(row.id, row);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        rows.forEach((row) => {
          if (row?.id) next.set(row.id, row);
        });
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Map());
  const selectedRows = useMemo(() => [...selected.values()], [selected]);

  return {
    selectedIds: selected,
    selectAllRef,
    allPageSelected,
    somePageSelected,
    toggleSelect,
    toggleSelectAllPage,
    clearSelection,
    selectedRows,
    selectedCount: selected.size,
    isSelected: (id) => selected.has(id),
  };
}
