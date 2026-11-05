import { useEffect, useMemo, useState } from 'react';
import {
  POS_CATALOG_VIRTUAL_OVERSCAN_ROWS,
  posCatalogColumnCount,
  posCatalogRowHeight,
} from '../../utils/posCatalogGridMetrics';
import { measurePosCatalogLayout } from '../../utils/measurePosCatalogLayout';

function readScroll(el) {
  if (!el) return { height: 0, scrollTop: 0, width: 0 };
  return {
    height: el.clientHeight || 0,
    scrollTop: el.scrollTop || 0,
    width: el.clientWidth || 0,
  };
}

/**
 * Windowed rows for POS catalog inside an external scroll parent (panel body).
 * Column/row metrics come from a live CSS probe when possible.
 */
export function usePosCatalogVirtualWindow({
  scrollParentRef,
  itemCount,
  viewMode,
}) {
  const [scroll, setScroll] = useState(() => ({ height: 0, scrollTop: 0, width: 0 }));
  const [layout, setLayout] = useState(() => ({
    columns: posCatalogColumnCount(viewMode, 0),
    rowHeight: posCatalogRowHeight(viewMode),
  }));

  useEffect(() => {
    const el = scrollParentRef?.current;
    if (!el) return undefined;

    const syncScroll = () => {
      setScroll((prev) => {
        const next = readScroll(el);
        if (
          next.scrollTop === prev.scrollTop &&
          next.height === prev.height &&
          next.width === prev.width
        ) {
          return prev;
        }
        return next;
      });
    };

    const syncLayout = () => {
      const measured = measurePosCatalogLayout({ hostEl: el, viewMode });
      setLayout((prev) => {
        if (prev.columns === measured.columns && prev.rowHeight === measured.rowHeight) {
          return prev;
        }
        return measured;
      });
      syncScroll();
    };

    syncLayout();
    el.addEventListener('scroll', syncScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncLayout) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', syncScroll);
      ro?.disconnect();
    };
  }, [scrollParentRef, viewMode]);

  const columns = Math.max(1, layout.columns || 1);
  const rowHeight = Math.max(1, layout.rowHeight || posCatalogRowHeight(viewMode));
  const rowCount = Math.max(1, Math.ceil(Math.max(0, itemCount) / columns));

  return useMemo(() => {
    // No measured viewport (missing scroll parent / first paint): paint all rows.
    // Otherwise overscan*2 alone caps the list at 8 and leaves a blank spacer.
    if (!scroll.height) {
      return {
        columns,
        rowHeight,
        totalHeight: rowCount * rowHeight,
        offsetY: 0,
        startIndex: 0,
        endIndex: itemCount,
      };
    }

    const overscan = POS_CATALOG_VIRTUAL_OVERSCAN_ROWS;
    const startRow = Math.max(0, Math.floor(scroll.scrollTop / rowHeight) - overscan);
    const visibleRows = Math.ceil(scroll.height / rowHeight) + overscan * 2;
    const endRow = Math.min(rowCount, startRow + Math.max(visibleRows, 1));
    const startIndex = startRow * columns;
    const endIndex = Math.min(itemCount, endRow * columns);

    return {
      columns,
      rowHeight,
      totalHeight: rowCount * rowHeight,
      offsetY: startRow * rowHeight,
      startIndex,
      endIndex,
    };
  }, [columns, itemCount, rowCount, rowHeight, scroll.height, scroll.scrollTop]);
}
