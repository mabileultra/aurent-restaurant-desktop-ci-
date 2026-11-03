export default function ReadyDisplayNumber({ order, highlight = false }) {
  return (
    <li className={`rst-rdy-num${highlight ? ' is-new' : ''}`}>
      <span className="rst-rdy-num__hash" aria-hidden>#</span>
      <strong className="rst-rdy-num__value">{order.orderNo}</strong>
      {order.tableCode ? (
        <span className="rst-rdy-num__place">{order.tableCode}</span>
      ) : null}
    </li>
  );
}
