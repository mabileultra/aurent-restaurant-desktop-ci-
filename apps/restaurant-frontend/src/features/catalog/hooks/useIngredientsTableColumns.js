import { useCallback, useState } from 'react';
import {
  INGREDIENTS_COLUMN_DEFS,
  loadIngredientsColumnVisibility,
  saveIngredientsColumnVisibility,
} from '../utils/ingredientsTableColumns';

export function useIngredientsTableColumns() {
  const [visible, setVisible] = useState(loadIngredientsColumnVisibility);

  const toggleColumn = useCallback((id) => {
    const def = INGREDIENTS_COLUMN_DEFS.find((c) => c.id === id);
    if (!def || def.locked) return;
    setVisible((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveIngredientsColumnVisibility(next);
      return next;
    });
  }, []);

  const visibleDefs = INGREDIENTS_COLUMN_DEFS.filter((c) => visible[c.id]);

  return {
    columnDefs: INGREDIENTS_COLUMN_DEFS,
    visible,
    visibleDefs,
    toggleColumn,
  };
}
