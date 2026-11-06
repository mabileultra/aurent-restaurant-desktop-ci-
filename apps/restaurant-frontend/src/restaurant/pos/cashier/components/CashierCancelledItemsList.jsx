import { useMemo, useState } from 'react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import '../styles/cashier-cancelled-items.css';

function formatWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function channelLabel(row, t) {
  const ch = String(row?.channel || '').toUpperCase();
  if (ch === 'TAKEAWAY') return t('rst.pos.takeaway');
  if (ch === 'DELIVERY') return t('rst.pos.delivery');
  return t('rst.pos.floor');
}

/**
 * Dish-level refusals: time, hall, table, check, dish, amount.
 */
export default function CashierCancelledItemsList({
  rows = [],
  loading = false,
  emptyText,
  pageSize = 14,
  onOpenOrder,
  openingId = null,
  t,
}) {
  const [page, setPage] = useState(0);
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => {
    const start = safePage * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  if (loading && !rows.length) {
    return <div className="rst-cashier-cancelled__empty">{t('common.loading')}</div>;
  }
  if (!rows.length) {
    return <div className="rst-cashier-cancelled__empty">{emptyText}</div>;
  }

  return (
    <section className="rst-cashier-cancelled">
      <ul className="rst-cashier-cancelled__list">
        {pageRows.map((row) => {
          const busy = openingId != null && String(openingId) === String(row.orderId);
          const place = [
            row.hallName || null,
            row.tableCode
              ? t('rst.floor.tableTitle', { code: row.tableCode, defaultValue: `Стол ${row.tableCode}` })
              : channelLabel(row, t),
          ].filter(Boolean).join(' · ');
          return (
            <li key={row.id}>
              <button
                type="button"
                className={`rst-cashier-cancelled__row${busy ? ' is-busy' : ''}`}
                onClick={() => onOpenOrder?.(row)}
                disabled={busy || !onOpenOrder}
              >
                <div className="rst-cashier-cancelled__top">
                  <span className="rst-cashier-cancelled__when">{formatWhen(row.cancelledAt)}</span>
                  <strong className="rst-cashier-cancelled__amount">
                    {fmtMoneyCompact(row.lineTotal || 0)}
                  </strong>
                </div>
                <div className="rst-cashier-cancelled__place">{place}</div>
                <div className="rst-cashier-cancelled__dish">
                  <span>
                    {t('rst.floor.checkNo', { no: row.orderNo })}
                    {' · '}
                    {row.itemName}
                    {' × '}
                    {Number(row.quantity) || 0}
                  </span>
                  <em>{t('rst.order.refuseShort')}</em>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {total > pageSize ? (
        <div className="rst-cashier-cancelled__pager">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t('common.prev')}
          </button>
          <span>{safePage + 1} / {pageCount}</span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            {t('common.next')}
          </button>
        </div>
      ) : null}
    </section>
  );
}
