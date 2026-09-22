export default function StockInventoryMetaPanel({
  t,
  storeId,
  onStoreChange,
  stores,
  needsStorePick,
  notes,
  onNotesChange,
}) {
  return (
    <div className="rst-stock-doc-meta">
      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{t('stockReports.colStore')}</span>
        <select
          className="form-select"
          value={storeId}
          onChange={onStoreChange}
          disabled={!needsStorePick && stores.length <= 1}
        >
          <option value="">
            {needsStorePick ? t('stockModal.pickStore') : '—'}
          </option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{t('stockReports.writeOffNotes')}</span>
        <input
          className="form-control"
          value={notes}
          onChange={onNotesChange}
        />
      </label>
    </div>
  );
}
