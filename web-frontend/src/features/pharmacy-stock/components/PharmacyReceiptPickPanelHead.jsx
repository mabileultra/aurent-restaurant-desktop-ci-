import '../styles/pharmacy-receipt-pick.css';

export default function PharmacyReceiptPickPanelHead({ title, hint, count }) {
  return (
    <div className="pharmacy-receipt-pick-head">
      <div className="pharmacy-receipt-pick-head__copy">
        <p className="pharmacy-receipt-pick-head__title">{title}</p>
        {hint ? <p className="pharmacy-receipt-pick-head__hint">{hint}</p> : null}
      </div>
      <span className="pharmacy-receipt-pick-head__count">{count}</span>
    </div>
  );
}
