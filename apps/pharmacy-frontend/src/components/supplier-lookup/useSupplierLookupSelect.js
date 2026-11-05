import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supplierApi } from '../../api';

const DEBOUNCE_MS = 250;

export function useSupplierLookupSelect({
  value,
  pageSize = 30,
  disabled = false,
  onBlur,
  name,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const selectedQuery = useQuery({
    queryKey: ['supplier-lookup-selected', value],
    queryFn: async () => {
      const res = await supplierApi.getAll({ page: 0, size: 200 });
      const list = res.data?.content ?? res.data ?? [];
      return list.find((s) => String(s.id) === String(value)) ?? null;
    },
    enabled: !!value,
  });

  const searchQuery = useQuery({
    queryKey: ['supplier-lookup-search', debouncedQuery],
    queryFn: () =>
      supplierApi
        .getAll({
          search: debouncedQuery || undefined,
          page: 0,
          size: pageSize,
        })
        .then((r) => r.data?.content ?? r.data ?? []),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const candidates = searchQuery.data ?? [];
  const selectedSupplier = selectedQuery.data;

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setHighlightIndex(-1);
    onBlur?.({ target: { value: value ?? '', name } });
  }, [name, onBlur, value]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
  }, [disabled]);

  useLayoutEffect(() => {
    if (!open || !inputRef.current) return undefined;

    const gap = 4;
    const edgePadding = 8;

    const estimateMenuHeight = () => {
      const menuEl = menuRef.current;
      if (menuEl?.offsetHeight) return menuEl.offsetHeight;
      const count = Math.max(candidates.length, 1);
      return Math.min(count * 44 + 16, 240);
    };

    const updatePosition = () => {
      const rect = inputRef.current.getBoundingClientRect();
      const menuHeight = estimateMenuHeight();
      const spaceBelow = window.innerHeight - edgePadding - rect.bottom;
      const spaceAbove = rect.top - edgePadding;
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      let top = openUpward ? rect.top - menuHeight - gap : rect.bottom + gap;
      top = Math.max(edgePadding, Math.min(top, window.innerHeight - menuHeight - edgePadding));

      setMenuStyle({
        top,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, candidates.length]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (root?.contains(event.target) || menu?.contains(event.target)) return;
      close();
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [close, open]);

  useEffect(() => {
    if (!open || candidates.length === 0) return;
    const selectedIndex = candidates.findIndex((s) => String(s.id) === String(value));
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, candidates, value]);

  return {
    listId,
    rootRef,
    inputRef,
    menuRef,
    open,
    openMenu,
    close,
    query,
    setQuery,
    debouncedQuery,
    candidates,
    selectedSupplier,
    searchLoading: searchQuery.isLoading || searchQuery.isFetching,
    highlightIndex,
    setHighlightIndex,
    menuStyle,
  };
}
