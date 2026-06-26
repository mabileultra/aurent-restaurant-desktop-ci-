const STATUS_CLASS = {
  PENDING: 'kitchen-ticket--pending',
  IN_PROGRESS: 'kitchen-ticket--progress',
  READY: 'kitchen-ticket--ready',
};

export default function KitchenTicketCard({ ticket, departmentLabel, onAdvance, isPending, t }) {
  const nextLabel = {
    PENDING: t('restaurantKitchen.startCooking'),
    IN_PROGRESS: t('restaurantKitchen.markReady'),
    READY: t('restaurantKitchen.markServed'),
  }[ticket.status];

  return (
    <article className={`kitchen-ticket ${STATUS_CLASS[ticket.status] ?? ''}`}>
      <header className="kitchen-ticket__head">
        <span className="kitchen-ticket__table">{ticket.tableCode}</span>
        <span className="kitchen-ticket__status">{t(`restaurantKitchen.status_${ticket.status}`)}</span>
      </header>
      <div className="kitchen-ticket__body">
        <h3 className="kitchen-ticket__name">{ticket.productName}</h3>
        <p className="kitchen-ticket__qty">× {ticket.quantity}</p>
        {ticket.note ? <p className="kitchen-ticket__note">{ticket.note}</p> : null}
        {ticket.kitchenDepartment ? (
          <p className="kitchen-ticket__department">{departmentLabel ?? ticket.kitchenDepartment}</p>
        ) : null}
      </div>
      <footer className="kitchen-ticket__foot">
        <button
          type="button"
          className="kitchen-ticket__btn"
          disabled={isPending || !nextLabel}
          onClick={onAdvance}
        >
          {nextLabel}
        </button>
      </footer>
    </article>
  );
}
