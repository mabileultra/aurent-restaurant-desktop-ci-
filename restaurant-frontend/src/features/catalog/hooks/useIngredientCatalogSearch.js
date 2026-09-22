import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../../../api';

const DEBOUNCE_MS = 250;

/**
 * Search own catalog products by name/sku/barcode for IngredientModal.
 */
export function useIngredientCatalogSearch({ enabled, storeId }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const canSearch = enabled && debounced.length >= 1;

  const search = useQuery({
    queryKey: ['ingredient-catalog-search', debounced, storeId],
    queryFn: () =>
      warehouseApi
        .getProducts({
          search: debounced,
          page: 0,
          size: 20,
          ...(storeId != null ? { storeId: Number(storeId) } : {}),
        })
        .then((r) => r.data),
    enabled: canSearch,
    placeholderData: keepPreviousData,
  });

  return {
    query,
    setQuery,
    results: search.data?.content ?? [],
    loading: search.isFetching,
    canSearch,
    clear: () => {
      setQuery('');
      setDebounced('');
    },
  };
}
