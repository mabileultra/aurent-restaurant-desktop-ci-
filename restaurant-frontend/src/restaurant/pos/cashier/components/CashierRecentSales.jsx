import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import '../styles/cashier-recent-sales.css';

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
  selectedId = null,
  onOpenReceipt,
  openingId = null,
  emptyText,
  t,
}) {
  return (
    <section className="rst-cashier-recent">
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

      {loading ? (
        <div className="rst-notice">{t('common.loading')}</div>
      ) : rows.length === 0 ? (
        <div className="rst-cashier-recent__empty">{emptyText}</div>
      ) : (
        <ul className="rst-cashier-recent__list">
          {rows.map((row) => {
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
                      {row.paymentMethod === 'CARD'
                        ? t('rst.order.payCard')
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
      )}
    </section>
  );
}
