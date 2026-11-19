export function ToggleSwitch({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <span className="text-sm text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-primary-500' : 'bg-line-strong'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

export function VariantTabs({ variant, onChange, labelTab, priceTagTab }) {
  const tabCls = (active) =>
    `rounded-input px-3 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-primary-500 text-white shadow-xs'
        : 'text-ink-muted hover:bg-primary-50 hover:text-ink'
    }`;

  return (
    <div className="flex gap-1 rounded-card border border-line bg-canvas p-1">
      <button type="button" className={tabCls(variant === 'label')} onClick={() => onChange('label')}>
        {labelTab}
      </button>
      <button type="button" className={tabCls(variant === 'priceTag')} onClick={() => onChange('priceTag')}>
        {priceTagTab}
      </button>
    </div>
  );
}

export function CopiesStepper({ label, copies, onChange, onBump }) {
  return (
    <div className="mb-6 mt-2 flex items-center justify-center gap-4">
      <span className="text-sm text-ink-muted">{label}</span>
      <button
        type="button"
        className="ui-btn-secondary h-10 w-10 p-0 text-lg"
        onClick={() => onBump(-1)}
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={999}
        value={copies}
        onChange={(e) => onChange(e.target.value)}
        className="ui-input h-10 w-20 px-2 text-center font-mono ui-tabular text-base"
      />
      <button
        type="button"
        className="ui-btn-secondary h-10 w-10 p-0 text-lg"
        onClick={() => onBump(1)}
      >
        +
      </button>
    </div>
  );
}
