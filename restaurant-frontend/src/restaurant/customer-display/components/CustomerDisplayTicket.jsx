import { useEffect, useRef } from 'react';
import { fmtMoneyCompact } from '../../../utils/formatMoney';

function DishThumb({ name, imageUrl }) {
  if (imageUrl) {
    return <img className="rst-cfd__thumb" src={imageUrl} alt="" />;
  }
  const letter = String(name || '?').trim().charAt(0).toUpperCase() || '?';
  return <div className="rst-cfd__thumb rst-cfd__thumb--empty" aria-hidden>{letter}</div>;
}

export default function CustomerDisplayTicket({ snapshot, t }) {
  const listRef = useRef(null);
  const lines = snapshot.lines || [];
  const orderLabel = snapshot.orderNo != null
    ? t('rst.cfd.receiptNo', { no: snapshot.orderNo })
    : t('rst.cfd.receipt');

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines.length, snapshot.total, snapshot.updatedAt]);

  return (
    <div className="rst-cfd__ticket">
      <div className="rst-cfd__ticket-head">
        <h2 className="rst-cfd__ticket-no">{orderLabel}</h2>
        {snapshot.storeName ? (
          <p className="rst-cfd__ticket-store">{snapshot.storeName}</p>
        ) : null}
      </div>

      <div className="rst-cfd__table-wrap" ref={listRef}>
        <table className="rst-cfd__table">
          <thead>
            <tr>
              <th>{t('rst.cfd.colName')}</th>
              <th>{t('rst.cfd.colQty')}</th>
              <th>{t('rst.cfd.colSum')}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td>
                  <div className="rst-cfd__dish">
                    <DishThumb name={line.name} imageUrl={line.imageUrl} />
                    <span className="rst-cfd__dish-name">{line.name}</span>
                  </div>
                </td>
                <td>{line.qty}</td>
                <td>{fmtMoneyCompact(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rst-cfd__totals">
        <div className="rst-cfd__total-row">
          <span>{t('rst.cfd.subtotal')}</span>
          <strong>{fmtMoneyCompact(snapshot.subtotal)}</strong>
        </div>
        {snapshot.serviceAmount > 0 ? (
          <div className="rst-cfd__total-row">
            <span>{t('rst.cfd.service')}</span>
            <strong>{fmtMoneyCompact(snapshot.serviceAmount)}</strong>
          </div>
        ) : null}
        {snapshot.discountAmount > 0 ? (
          <div className="rst-cfd__total-row rst-cfd__total-row--discount">
            <span>{t('rst.cfd.discount')}</span>
            <strong>−{fmtMoneyCompact(snapshot.discountAmount)}</strong>
          </div>
        ) : null}
        <div className="rst-cfd__total-row rst-cfd__total-row--due">
          <span>{t('rst.cfd.due')}</span>
          <strong>{fmtMoneyCompact(snapshot.total)}</strong>
        </div>
      </div>
    </div>
  );
}
