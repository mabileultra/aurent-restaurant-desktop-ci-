import '../styles/cashier-panel-back.css';

export default function CashierPanelBack({ onBack, label }) {
  return (
    <button type="button" className="rst-cashier-panel-back" onClick={onBack}>
      ← {label}
    </button>
  );
}
