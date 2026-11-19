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
    () => categoryApi.getAll(onlineCatalogConfig(signal)).then((r) => r.data), // prosecutor-ignore: taxonomy lookup
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
        : productApi.getAll( // prosecutor-ignore: paginated by page and size
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

export function posProductsNextPageParam(lastPage, allPages, catalogKind) {
  const pageSize = posCatalogPageSize(catalogKind);
  if (!lastPage || !lastPage.content || lastPage.content.length < pageSize) {
    return undefined;
  }
  return allPages.length * pageSize;
}

export async function posFetchProductByBarcode({ storeId, barcode, signal, catalogKind }) {
  const code = (barcode || '').trim();
  if (!code) return null;
  const { route, canFallback } = routeFor(storeId);
  const pharmacy = catalogKind === 'pharmacy';
  if (route === 'local') {
    return offlineGetProductByBarcode(code);
  }
  try {
    const fn = pharmacy
      ? pharmacyWarehouseApi.barcode(storeId, code, onlineCatalogConfig(signal))
      : productApi.barcode(code, onlineCatalogConfig(signal));
    return await fn.then((r) => r.data);
  } catch (err) {
    if (canFallback && isDesktopOfflineBridge() && isApiUnreachableError(err)) {
      return offlineGetProductByBarcode(code);
    }
    const notFoundStatus = 404;
    if (err?.response?.status === notFoundStatus) return null;
    throw err;
  }
}
