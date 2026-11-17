import { categoryApi, pharmacyWarehouseApi, productApi } from '../api';
import { POS_PRODUCT_PAGE_SIZE, posCatalogPageSize } from '../../features/cashier/components/pos/posCatalogConstants';
import {
  offlineListCategories,
  offlineSearchProducts,
  isDesktopOfflineBridge,
  offlineGetProductByBarcode,
} from '../offline/desktopOfflineBridge';
import { routeFor, withRemoteFallback, onlineCatalogConfig } from './posRouterShared';

export function buildOfflineProductsPage(content, pageParam, pageSize = POS_PRODUCT_PAGE_SIZE) {
  const total =
    content.length < pageSize
      ? pageParam + content.length
      : pageParam + content.length + 1;
  return {
    content,
    number: pageParam / pageSize,
    totalPages:
      content.length < pageSize
        ? pageParam / pageSize + 1
        : pageParam / pageSize + 2,
    totalElements: total,
  };
}

export function getPosCatalogMode(storeId) {
  return routeFor(storeId).route === 'local' ? 'offline' : 'online';
}

export async function posFetchCategories({ storeId, signal } = {}) {
  return withRemoteFallback(
    storeId,
    () => categoryApi.getAll(onlineCatalogConfig(signal)).then((r) => r.data),
    () => offlineListCategories(),
  );
}

export async function posFetchProductsPage({
  storeId,
  categoryId,
  search,
  pageParam,
  signal,
  catalogKind,
}) {
  const trimmedSearch = search?.trim() || '';
  const pharmacy = catalogKind === 'pharmacy';
  const pageSize = posCatalogPageSize(catalogKind);
  return withRemoteFallback(
    storeId,
    () =>
      (pharmacy
        ? pharmacyWarehouseApi.listProducts(
            {
              storeId,
              search: trimmedSearch || undefined,
              page: pageParam,
              size: pageSize,
              activeOnly: true,
              scope: 'ACTIVE',
            },
            onlineCatalogConfig(signal),
          )
        : productApi.getAll(
            {
              storeId,
              categoryId,
              search: trimmedSearch || undefined,
              page: pageParam,
              size: pageSize,
              activeOnly: true,
            },
            onlineCatalogConfig(signal),
          )
      ).then((r) => r.data),
    async () => {
      const content = await offlineSearchProducts({
        search: trimmedSearch,
        categoryId,
        limit: pageSize,
        offset: pageParam,
      });
      return buildOfflineProductsPage(content, pageParam, pageSize);
    },
  );
}

export function posProductsNextPageParam(lastPage, lastPageParam, storeId = null, catalogKind = null) {
  const useLocal = routeFor(storeId).route === 'local';
  const pageSize = posCatalogPageSize(catalogKind);
  const next = (lastPage?.number ?? 0) + 1;
  const total = lastPage?.totalPages ?? 0;
  return next < total ? (useLocal ? lastPageParam + pageSize : next) : undefined;
}

export async function posFetchProductByBarcode(storeId, barcode, { catalogKind } = {}) {
  const trimmed = String(barcode || '').trim();
  if (!trimmed) return null;
  const pharmacy = catalogKind === 'pharmacy';
  // Electron: сначала локальный каталог — скан не ждёт сеть при попадании.
  if (isDesktopOfflineBridge()) {
    try {
      const local = await offlineGetProductByBarcode(trimmed);
      if (local) return local;
    } catch {
      /* fall through to route */
    }
  }
  return withRemoteFallback(
    storeId,
    async () => {
      try {
        const res = await (pharmacy
          ? pharmacyWarehouseApi.getByBarcode(trimmed, storeId)
          : productApi.getByBarcode(trimmed, storeId));
        return res.data;
      } catch (err) {
        // 404 → null, чтобы касса могла перебрать GTIN/EAN-кандидаты
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    () => offlineGetProductByBarcode(trimmed),
  );
}
