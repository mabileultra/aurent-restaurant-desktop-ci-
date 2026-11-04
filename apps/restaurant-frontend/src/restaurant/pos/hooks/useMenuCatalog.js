import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rstMenuApi } from '../../api/menu.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { localDayKey, recordMenuPunch } from '../utils/menuPunchFrequency';
import { readMenuFavorites, toggleMenuFavorite } from '../utils/menuFavorites';
import { buildCategoryTiles, filterMenuFamilies } from '../utils/menuCatalogFilters';
import { groupMenuFamilies } from '../components/MenuVariantPickModal';

export function useMenuCatalog({
  items,
  t,
  rankByPunch = true,
}) {
  const workspace = useRestaurantWorkspaceStore();
  const storeId = workspace.storeId;
  const [category, setCategory] = useState('');
  const [listFilter, setListFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [favoritesTick, setFavoritesTick] = useState(0);
  const [searchSlot, setSearchSlot] = useState(null);
  const searchRef = useRef(null);
  const rankingDay = localDayKey();
  const uncategorized = t('rst.order.uncategorized');
  const favoriteKeys = useMemo(
    () => new Set(readMenuFavorites(storeId)),
    [storeId, favoritesTick],
  );

  const categoriesQuery = useQuery({
    queryKey: ['rst-menu-categories', storeId],
    queryFn: () => rstMenuApi.listCategories(storeId, true).then((r) => r.data),
    enabled: storeId != null,
    staleTime: 30_000,
  });

  useLayoutEffect(() => {
    setSearchSlot(document.getElementById('rst-pos-search-slot'));
  }, [storeId, rankByPunch]);

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      const typing = target
        && (target.tagName === 'INPUT'
          || target.tagName === 'TEXTAREA'
          || target.tagName === 'SELECT'
          || target.isContentEditable);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tiles = useMemo(
    () => buildCategoryTiles(items, categoriesQuery.data ?? [], uncategorized),
    [items, categoriesQuery.data, uncategorized],
  );

  const families = useMemo(
    () => filterMenuFamilies({
      items,
      category,
      listFilter,
      query,
      storeId,
      rankByPunch,
      uncategorizedLabel: uncategorized,
    }),
    [items, category, listFilter, query, storeId, rankByPunch, uncategorized, rankingDay, favoritesTick],
  );

  const totalFamilies = useMemo(() => groupMenuFamilies(items || []).length, [items]);

  const pickFamily = (family, { onComposeFamily, onAdd }) => {
    recordMenuPunch(storeId, family.key);
    if (onComposeFamily) onComposeFamily(family);
    else if (family.multi) onAdd(family.variants[0]);
    else onAdd(family.primary);
  };

  const toggleFavorite = (familyKey) => {
    toggleMenuFavorite(storeId, familyKey);
    setFavoritesTick((n) => n + 1);
  };

  return {
    storeId,
    category,
    setCategory,
    listFilter,
    setListFilter,
    query,
    setQuery,
    searchSlot,
    searchRef,
    tiles,
    families,
    totalFamilies,
    favoriteKeys,
    toggleFavorite,
    pickFamily,
    empty: !(items && items.length),
  };
}
