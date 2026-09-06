const VARIANT_CLS = {
  full: 'admin-btn-primary w-full py-3 text-sm sm:w-auto sm:px-8',
  compact: 'admin-btn-primary px-6 py-2.5 text-sm',
};

export default function StockDocumentSubmitButton({ label, onClick, disabled, variant = 'compact' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={VARIANT_CLS[variant]}
    >
      {label}
    </button>
  );
}
