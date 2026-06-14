export function FinanceDetailFieldCard({ label, value, icon: Icon, mono = false }) {
  if (value === null || value === undefined || value === '') return null;

  return (
    <div className="finance-detail-modal__field">
      <p className="finance-detail-modal__field-label">{label}</p>
      <div className="finance-detail-modal__field-row">
        {Icon ? (
          <span className="finance-detail-modal__field-icon" aria-hidden>
            <Icon size={16} />
          </span>
        ) : null}
        <p className={`finance-detail-modal__field-value ${mono ? 'finance-detail-modal__field-value--mono' : ''}`.trim()}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function FinanceDetailFieldGrid({ children, className = '' }) {
  return (
    <div className={`finance-detail-modal__grid ${className}`.trim()}>
      {children}
    </div>
  );
}
