export default function SettingsFieldToggles({ defs, values, onChange, labelFor }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {defs.map(({ key, labelKey }) => (
        <label
          key={key}
          className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-canvas px-3 py-2 text-sm hover:border-line-strong"
        >
          <input
            type="checkbox"
            className="rounded border-line-strong accent-primary-500"
            checked={values[key] !== false}
            onChange={(e) => onChange(key, e.target.checked)}
          />
          <span className="text-ink">{labelFor(labelKey)}</span>
        </label>
      ))}
    </div>
  );
}
