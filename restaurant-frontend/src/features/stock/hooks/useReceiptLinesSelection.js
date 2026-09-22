import { useEffect, useMemo, useRef, useState } from 'react';

/** Selection by line.key */
export function useReceiptLinesSelection(lines) {
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const selectAllRef = useRef(null);

  const pageKeys = useMemo(() => lines.map((l) => l.key), [lines]);
  const allSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedKeys.has(k));
  const someSelected = pageKeys.some((k) => selectedKeys.has(k));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  useEffect(() => {
    setSelectedKeys((prev) => {
      const valid = new Set(pageKeys);
      let changed = false;
      const next = new Set();
      for (const k of prev) {
        if (valid.has(k)) next.add(k);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [pageKeys]);

  const toggle = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedKeys((prev) => {
      if (allSelected) return new Set();
      return new Set(pageKeys);
    });
  };

  const clear = () => setSelectedKeys(new Set());

  return {
    selectedKeys,
    selectAllRef,
    allSelected,
    someSelected,
    toggle,
    toggleAll,
    clear,
  };
}
