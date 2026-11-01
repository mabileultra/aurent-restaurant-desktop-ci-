/** Кол-во в импорте: − / ввод / +. */
export default function ProductImportQtyStepper({
  value,
  onMinus,
  onPlus,
  onChange,
  minusLabel,
  plusLabel,
}) {
  const n = Number(value);
  const display = value == null || value === '' ? '' : String(value);
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
      <input
        type="text"
        inputMode="decimal"
        className="product-import-qty__input"
        value={display}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label={plusLabel ? undefined : 'qty'}
      />
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
