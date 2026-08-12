export default function ScalesPluInput({ t, value, onChange, onSubmit, loading, disabled }) {
  return (
    <form
      className="scales-plu-input"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <label className="scales-plu-input__label" htmlFor="scales-plu-code">
        {t('scales.pluLabel')}
      </label>
      <div className="scales-plu-input__row">
        <input
          id="scales-plu-code"
          className="scales-plu-input__field"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={5}
          placeholder="12"
          value={value}
          disabled={disabled || loading}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
        />
        <button type="submit" className="scales-btn" disabled={disabled || loading || !value}>
          {loading ? t('scales.loading') : t('scales.findProduct')}
        </button>
      </div>
    </form>
  );
}
