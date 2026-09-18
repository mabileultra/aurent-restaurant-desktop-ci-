import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ALL_CATEGORY_ID } from '../usePosCatalogPanel';
import { markApiUnreachable, useConnectivityStore } from '../../../../store/connectivityStore';
import { resolvePosRoute } from '../../../../services/pos/posRouteResolver';
import {
  posFetchCategories,
  posFetchProductsPage,
  posProductsNextPageParam,
} from '../../../../services/pos/posDataRouter';
import { isDesktopOfflineBridge } from '../../../../services/offline/desktopOfflineBridge';
import { usePosCatalogPrefetch } from './usePosCatalogPrefetch';
import { isPosProductsSearchStale } from './posProductsSearchStale';

function invalidatePosCatalogQueries(qc) {
  qc.cancelQueries({ queryKey: ['pos-categories'] });
  qc.cancelQueries({ queryKey: ['pos-products'] });
  qc.invalidateQueries({ queryKey: ['pos-categories'] });
  qc.invalidateQueries({ queryKey: ['pos-products'] });
}

export function usePosProductsCatalog({ storeId, catalogKind } = {}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_ID);
  const [catalogBrowse, setCatalogBrowse] = useState('categories');
  const catalogMode = useConnectivityStore((s) => (
    resolvePosRoute(storeId, s).route === 'local' ? 'offline' : 'online'
  ));
  const prevCatalogModeRef = useRef(catalogMode);

  const searchActive = search.trim().length > 0;
  const categoryFilterId =
    searchActive || selectedCategoryId === ALL_CATEGORY_ID
      ? undefined
      : selectedCategoryId;

  const productsEnabled =
    !!storeId && (searchActive || catalogBrowse === 'products');

  useEffect(() => {
    if (!isDesktopOfflineBridge() || !storeId) return undefined;
    const prev = prevCatalogModeRef.current;
    if (prev !== catalogMode) {
      invalidatePosCatalogQueries(qc);
    }
    prevCatalogModeRef.current = catalogMode;
  }, [catalogMode, storeId, qc]);

  useEffect(() => {
    if (!isDesktopOfflineBridge() || typeof window === 'undefined') return undefined;
    const onBrowserOffline = () => {
      markApiUnreachable();
    };
    window.addEventListener('offline', onBrowserOffline);
    return () => window.removeEventListener('offline', onBrowserOffline);
  }, []);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ['pos-categories', storeId, catalogMode],
    queryFn: ({ signal }) => posFetchCategories({ storeId, signal }),
    enabled: !!storeId,
    retry: catalogMode === 'offline' ? false : 1,
    staleTime: catalogMode === 'offline' ? Infinity : 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const {
    data: productsPages,
    isLoading: productsLoading,
    isError: productsError,
    isFetching: productsFetching,
    isFetchingNextPage: productsLoadingMore,
    isPlaceholderData: productsPlaceholder,
    hasNextPage: productsHasMore,
    fetchNextPage: fetchMoreProducts,
  } = useInfiniteQuery({
    queryKey: [
      'pos-products',
      storeId,
      categoryFilterId,
      search.trim(),
      catalogMode,
      catalogKind || 'grocery',
    ],
    queryFn: ({ pageParam, signal }) =>
      posFetchProductsPage({
        storeId,
        categoryId: categoryFilterId,
        search,
        pageParam,
        signal,
        catalogKind,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      posProductsNextPageParam(lastPage, lastPageParam, storeId),
    enabled: productsEnabled,
    retry: catalogMode === 'offline' ? false : 1,
    staleTime: catalogMode === 'offline' ? Infinity : 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const products = productsPages?.pages.flatMap((page) => page?.content ?? []) ?? [];
  const pagesLoaded = productsPages?.pages?.length ?? 0;
  /** keepPreviousData: Enter/клик по списку нельзя, пока идёт новый поиск. */
  const productsStale = isPosProductsSearchStale({
    searchActive,
    productsPlaceholder,
    productsFetching,
    productsLoadingMore,
  });

  usePosCatalogPrefetch({
    enabled: productsEnabled && catalogMode === 'online',
    hasNextPage: productsHasMore,
    isFetchingNextPage: productsLoadingMore,
    fetchNextPage: fetchMoreProducts,
    pagesLoaded,
    queryKey: [
      storeId,
      categoryFilterId,
      search.trim(),
      catalogKind || 'grocery',
      catalogMode,
    ].join('|'),
  });

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCatalogBrowse('products');
  };

  return {
    search,
    setSearch,
    selectedCategoryId,
    setSelectedCategoryId,
    catalogBrowse,
    setCatalogBrowse,
    searchActive,
    categories,
    categoriesLoading,
    categoriesError,
    products,
    productsLoading,
    productsStale,
    productsError,
    productsLoadingMore,
    productsHasMore,
    fetchMoreProducts,
    handleSelectCategory,
  };
}
