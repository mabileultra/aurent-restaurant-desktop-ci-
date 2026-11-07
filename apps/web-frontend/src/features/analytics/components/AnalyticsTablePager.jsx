import React from 'react';

/** Shared Prev/Next pager for analytics tables (0-based page). */
export default function AnalyticsTablePager({
  page = 0,
  pageSize = 20,
  totalElements = 0,
  onPageChange,
}) {
  const maxPages = Math.max(1, Math.ceil(Number(totalElements || 0) / Math.max(1, pageSize)));
  if (maxPages <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderTop: '1px solid #f1f5f9',
        fontSize: '0.8rem',
      }}
    >
      <span style={{ color: '#64748b' }}>
        Sahifa {page + 1} / {maxPages} · {totalElements} ta
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className="an-btn an-btn--outline"
          disabled={page <= 0}
          onClick={() => onPageChange?.(Math.max(0, page - 1))}
          style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
        >
          Oldingi
        </button>
        <button
          type="button"
          className="an-btn an-btn--outline"
          disabled={page >= maxPages - 1}
          onClick={() => onPageChange?.(Math.min(maxPages - 1, page + 1))}
          style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
        >
          Keyingi
        </button>
      </div>
    </div>
  );
}
