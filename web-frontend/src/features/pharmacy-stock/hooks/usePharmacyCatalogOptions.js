import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyWarehouseApi } from '../../../api';
import {
  productAttr,
  productDosageForm,
} from '../../pharmacy-cashier/utils/pharmacyProductMeta';
import { productManufacturer } from '../utils/pharmacyReceiptPricing';

function unique(values) {
  return [...new Set(values.map((v) => String(v || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
}

export function productAtc(product) {
  return productAttr(product, 'atc_code', 'atc', 'атх', 'atcCode');
}

/** Справочники АТХ / производитель / форма — из уже заведённых товаров компании. */
export function usePharmacyCatalogOptions(enabled = true) {
  const query = useQuery({
    queryKey: ['pharmacy-catalog-options'],
    queryFn: () => pharmacyWarehouseApi.listProducts({
      page: 0,
      size: 500,
      activeOnly: false,
    }).then((r) => r.data),
    enabled,
    staleTime: 30_000,
  });

  const products = query.data?.content ?? [];

  return useMemo(() => ({
    products,
    total: query.data?.totalElements ?? products.length,
    manufacturers: unique(products.map(productManufacturer)),
    forms: unique(products.map(productDosageForm)),
    atcCodes: unique(products.map(productAtc)),
    isLoading: query.isLoading,
    refetch: query.refetch,
  }), [products, query.data?.totalElements, query.isLoading, query.refetch]);
}
