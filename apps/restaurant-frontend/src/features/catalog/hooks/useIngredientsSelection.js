import { useEffect, useMemo, useRef, useState } from 'react';

export function useIngredientsSelection({ rows, page, search, typeTab }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const selectAllRef = useRef(null);

  const pageIds = useMemo(() => rows.map((p) => p.id), [rows]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, search, typeTab]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  return {
    selectedIds,
    selectAllRef,
    allPageSelected,
    somePageSelected,
    toggleSelect,
    toggleSelectAllPage,
    clearSelection,
  };
}
