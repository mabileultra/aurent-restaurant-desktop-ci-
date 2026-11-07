import { useMemo, useState } from 'react';

/**
 * Xavfsizlik "Harakatlar jurnali" tabi mantiq hooki.
 * Backend audit API mavjud bo'lgunga qadar xavfsiz bo'sh holatda turadi.
 */
export function useSecurityAuditFlow() {
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedId, setSelectedId] = useState('');

  // Haqiqiy backend audit API integratsiyasi kutilmoqda
  const rawRows = useMemo(() => [], []);

  const filteredRows = useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows.filter((r) => {
      if (selectedModule === 'all') return true;
      return r.moduleKey === selectedModule;
    });
  }, [rawRows, selectedModule]);

  const selectedItem = useMemo(() => {
    if (filteredRows.length === 0) return null;
    const found = filteredRows.find((r) => r.id === selectedId);
    return found ?? filteredRows[0] ?? null;
  }, [filteredRows, selectedId]);

  return {
    selectedModule,
    setSelectedModule,
    filteredRows,
    selectedItem,
    selectedId: selectedItem?.id ?? '',
    selectRow: setSelectedId,
  };
}
