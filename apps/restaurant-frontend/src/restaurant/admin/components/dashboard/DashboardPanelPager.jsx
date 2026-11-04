import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/dashboard-panel-pager.css';

/**
 * Simple pager for dashboard list panels — keeps the board compact.
 */
export default function DashboardPanelPager({
  items = [],
  pageSize = 5,
  t,
  children,
}) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [total, pageSize]);

  const safePage = Math.min(page, totalPages - 1);

  const slice = useMemo(() => {
    const start = safePage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  if (total === 0) {
    return children(slice, null);
  }

  const pager = total > pageSize ? (
    <div className="rst-dash__pager">
      <button
        type="button"
        className="rst-dash__pager-btn"
        disabled={safePage <= 0}
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        aria-label={t('common.prev')}
      >
        <ChevronLeft size={16} strokeWidth={2.2} aria-hidden />
      </button>
      <span className="rst-dash__pager-meta">
        {t('rst.dashboard.pagerMeta', {
          page: safePage + 1,
          pages: totalPages,
          total,
        })}
      </span>
      <button
        type="button"
        className="rst-dash__pager-btn"
        disabled={safePage >= totalPages - 1}
        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        aria-label={t('common.next')}
      >
        <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
      </button>
    </div>
  ) : null;

  return children(slice, pager);
}
