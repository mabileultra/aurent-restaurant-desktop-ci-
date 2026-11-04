import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPharmacyFefoHints } from '../utils/fetchPharmacyFefoHints';

/**
 * Подмешивает FEFO-подсказки (ближайшая серия/срок) только для новых id страницы.
 */
export function usePharmacyFefoEnrichment(storeId, products = []) {
  const productIds = useMemo(
    () => (products || []).map((p) => p?.id).filter(Boolean).map(String),
    [products],
  );
  const hintCacheRef = useRef(new Map());
  const missingIds = useMemo(
    () => productIds.filter((id) => !hintCacheRef.current.has(id)),
    [productIds],
  );
  const missingKey = missingIds.join(',');

  const hintsQuery = useQuery({
    queryKey: ['pharmacy-fefo-hints', storeId, missingKey],
    queryFn: async () => {
      const fresh = await fetchPharmacyFefoHints(storeId, missingIds);
      for (const hint of fresh) {
        const id = hint?.productId != null ? String(hint.productId) : '';
        if (id) hintCacheRef.current.set(id, hint);
      }
      // Пометить запрошенные id даже без партии — не долбить API повторно.
      for (const id of missingIds) {
        if (!hintCacheRef.current.has(id)) {
          hintCacheRef.current.set(id, { productId: id, batchNumber: null, expiryDate: null });
        }
      }
      return fresh;
    },
    enabled: Boolean(storeId) && missingIds.length > 0,
    staleTime: 20_000,
  });

  const hintByProductId = useMemo(() => {
    // зависим от fetch, чтобы пересчитать после догрузки
    void hintsQuery.dataUpdatedAt;
    const map = new Map(hintCacheRef.current);
    return map;
  }, [hintsQuery.dataUpdatedAt, productIds]);

  const enrichedProducts = useMemo(() => {
    if (!hintByProductId.size) return products;
    return products.map((product) => {
      const hint = hintByProductId.get(String(product.id));
      if (!hint) return product;
      const batch = hint.batchNumber != null && String(hint.batchNumber).trim()
        ? String(hint.batchNumber).trim()
        : null;
      const expiry = hint.expiryDate != null && String(hint.expiryDate).trim()
        ? String(hint.expiryDate).trim().slice(0, 10)
        : null;
      if (!batch && !expiry) return product;
      return {
        ...product,
        lotBatch: batch || product.lotBatch || null,
        lotExpiry: expiry || product.lotExpiry || null,
        lotQuantity: hint.lotQuantity,
        attributes: {
          ...(product.attributes || {}),
          ...(batch ? { batch, batch_number: batch, batchNumber: batch } : {}),
          ...(expiry ? { expiry_date: expiry, expiryDate: expiry } : {}),
        },
      };
    });
  }, [products, hintByProductId]);

  return {
    products: enrichedProducts,
    hintsLoading: hintsQuery.isFetching,
  };
}
