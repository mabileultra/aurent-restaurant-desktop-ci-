import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import '../styles/cashier-recent-sales.css';

const DEFAULT_PAGE_SIZE = 12;

function channelLabel(row, t) {
  if (row.channel === 'DELIVERY') return t('rst.pos.delivery');
  if (row.channel === 'TAKEAWAY') return t('rst.pos.takeaway');
  if (row.tableCode) return t('rst.floor.tableTitle', { code: row.tableCode });
  return t('rst.pos.floor');
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Recent paid / refunded orders — select row to open receipt pane.
 */
export default function CashierRecentSales({
  rows = [],
  loading = false,
  refunded = false,
  cancelled = false,
  selectedId = null,
  onOpenReceipt,
  openingId = null,
  emptyText,
  pageSize = DEFAULT_PAGE_SIZE,
  paginate = true,
  hideHead = false,
  t,
}) {
  const usePager = paginate;
  const [page, setPage] = useState(0);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    setPage(0);
  }, [total, pageSize, refunded, cancelled]);

  const safePage = Math.min(page, totalPages - 1);

  const pageRows = useMemo(() => {
    if (!usePager) return rows;
    const start = safePage * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize, usePager]);

  useEffect(() => {
    if (!usePager || selectedId == null) return;
    const idx = rows.findIndex((r) => r.id === selectedId);
    if (idx < 0) return;
    const nextPage = Math.floor(idx / pageSize);
    setPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [selectedId, rows, pageSize, usePager]);

  return (
    <section className={`rst-cashier-recent${cancelled ? ' rst-cashier-recent--cancelled' : ''}`}>
      {hideHead || cancelled ? null : (
        <div className="rst-cashier-recent__head">
          <h3>
            {refunded
              ? t('rst.cashier.recentRefundsTitle')
              : t('rst.cashier.recentSalesTitle')}
          </h3>
          <p>
            {refunded
              ? t('rst.cashier.recentRefundsHint')
              : t('rst.cashier.recentSalesHint')}
          </p>
        </div>
      )}

      {loading ? (
        <div className="rst-notice">{t('common.loading')}</div>
      ) : total === 0 ? (
        <div className="rst-cashier-recent__empty">{emptyText}</div>
      ) : (
        <>
          <ul className="rst-cashier-recent__list">
            {pageRows.map((row) => {
              const busy = openingId === row.id;
              const selected = selectedId === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={`rst-cashier-recent__row${busy ? ' is-busy' : ''}${selected ? ' is-selected' : ''}`}
                    onClick={() => onOpenReceipt?.(row)}
                    disabled={busy}
                    aria-pressed={selected}
                  >
                    <div className="rst-cashier-recent__main">
                      <strong>№{row.orderNo}</strong>
                      <span className="rst-cashier-recent__channel">{channelLabel(row, t)}</span>
                      {row.clientName ? (
                        <span className="rst-cashier-recent__client">{row.clientName}</span>
                      ) : null}
                    </div>
                    <div className="rst-cashier-recent__meta">
                      <span>{formatTime(row.closedAt)}</span>
                      <span className="rst-cashier-recent__pay">
                        {cancelled
                          ? t('rst.order.refuseShort')
                          : row.paymentMethod === 'CARD'
                            ? t('rst.order.payCard')
                            : row.paymentMethod === 'CASHLESS'
                              ? t('rst.order.payCashless')
                            : row.paymentMethod === 'MIXED'
                              ? t('rst.order.payMixed')
                              : t('rst.order.payCash')}
                      </span>
                      <strong>{fmtMoneyCompact(row.totalAmount ?? row.paidAmount)}</strong>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {usePager && total > pageSize ? (
            <div className="rst-cashier-recent__pager">
              <button
                type="button"
                className="rst-cashier-recent__pager-btn"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label={t('common.prev')}
              >
                <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
              </button>
              <span className="rst-cashier-recent__pager-meta">
                {t('rst.dashboard.pagerMeta', {
                  page: safePage + 1,
                  pages: totalPages,
                  total,
                })}
              </span>
              <button
                type="button"
                className="rst-cashier-recent__pager-btn"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                aria-label={t('common.next')}
              >
                <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
