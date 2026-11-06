/** Receipt-only qty / prices block for IngredientModal. */
export default function IngredientReceiptFields({ t, form, onChange }) {
  return (
    <div className="rst-ingredient-modal__receipt">
      <p className="rst-ingredient-modal__receipt-title">
        {t('rst.nomenclature.receiptFieldsTitle')}
      </p>
      <div className="rst-ingredient-modal__row">
        <label className="rst-ingredient-modal__field">
          <span>* {t('stockReports.colQty')}</span>
          <input
            type="number"
            min={0.001}
            step="any"
            required
            value={form.receiptQty}
            onChange={(e) => onChange('receiptQty', e.target.value)}
          />
        </label>
        <label className="rst-ingredient-modal__field">
          <span>* {t('stockReports.purchasePrice')}</span>
          <input
            type="number"
            min="0"
            step="any"
            required
            value={form.costPrice}
            onChange={(e) => onChange('costPrice', e.target.value)}
          />
        </label>
      </div>
      <label className="rst-ingredient-modal__field">
        <span>* {t('stockReports.salePrice')}</span>
        <input
          type="number"
          min="0.01"
          step="any"
          required
          value={form.sellingPrice}
          onChange={(e) => onChange('sellingPrice', e.target.value)}
        />
      </label>
      <p className="rst-ingredient-modal__hint">{t('rst.nomenclature.receiptFieldsHint')}</p>
    </div>
  );
}
