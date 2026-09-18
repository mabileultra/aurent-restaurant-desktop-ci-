import { bumpInventoryQty } from '../../utils/inventoryQty';

export default function StockInventoryQtyStepper({ value, product, disabled, onChange, placeholder }) {
  const change = (next) => onChange(next);

  return (
    <div className="stock-inv-stepper">
      <button
        type="button"
        className="stock-inv-stepper__btn"
        disabled={disabled}
        onClick={() => change(bumpInventoryQty(value, product, -1))}
        aria-label="-"
      >
        −
      </button>
      <input
        className="stock-inv-stepper__input"
        inputMode="decimal"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => change(e.target.value)}
      />
      <button
        type="button"
        className="stock-inv-stepper__btn"
        disabled={disabled}
        onClick={() => change(bumpInventoryQty(value, product, 1))}
        aria-label="+"
      >
        +
      </button>
    </div>
  );
}
