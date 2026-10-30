export default function ProductImportQtyStepper({ value, onMinus, onPlus, minusLabel, plusLabel }) {
  const n = Number(value);
  const display = Number.isFinite(n) ? String(n) : '0';
  const atZero = !Number.isFinite(n) || n <= 0;

  return (
    <div className="product-import-qty">
      <button
        type="button"
        className="product-import-qty__btn"
        aria-label={minusLabel}
        disabled={atZero}
        onClick={onMinus}
      >
        −
      </button>
      <span className="product-import-qty__value">{display}</span>
      <button
        type="button"
        className="product-import-qty__btn"
        aria-label={plusLabel}
        onClick={onPlus}
      >
        +
      </button>
    </div>
  );
}
