import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyWarehouseApi } from '../../../api';

/**
 * Подмешивает FEFO-подсказки (ближайшая серия/срок) в товары аптечной кассы.
 */
export function usePharmacyFefoEnrichment(storeId, products = []) {
  const productIds = useMemo(
    () => (products || []).map((p) => p?.id).filter(Boolean),
    [products],
  );
  const idsKey = productIds.join(',');

  const hintsQuery = useQuery({
    queryKey: ['pharmacy-fefo-hints', storeId, idsKey],
    queryFn: () => pharmacyWarehouseApi.fefoHints({
      storeId,
      productIds: idsKey,
    }).then((r) => r.data),
    enabled: Boolean(storeId) && productIds.length > 0,
    staleTime: 20_000,
  });

  const hintByProductId = useMemo(() => {
    const map = new Map();
    for (const hint of hintsQuery.data ?? []) {
      if (hint?.productId) map.set(hint.productId, hint);
    }
    return map;
  }, [hintsQuery.data]);

  const enrichedProducts = useMemo(() => {
    if (!hintByProductId.size) return products;
    return products.map((product) => {
      const hint = hintByProductId.get(product.id);
      if (!hint) return product;
      return {
        ...product,
        lotBatch: hint.batchNumber || null,
        lotExpiry: hint.expiryDate || null,
        lotQuantity: hint.lotQuantity,
        attributes: {
          ...(product.attributes || {}),
          ...(hint.batchNumber ? { batch: hint.batchNumber } : {}),
          ...(hint.expiryDate ? { expiry_date: hint.expiryDate } : {}),
        },
      };
    });
  }, [products, hintByProductId]);

  return {
    products: enrichedProducts,
    hintsLoading: hintsQuery.isFetching,
  };
}
