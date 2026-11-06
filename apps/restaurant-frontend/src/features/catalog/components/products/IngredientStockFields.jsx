/** Stock qty + low-stock threshold for IngredientModal (catalog create/edit). */
export default function IngredientStockFields({ t, form, onChange, isEdit }) {
  return (
    <div className="rst-ingredient-modal__stock">
      <div className="rst-ingredient-modal__row">
        <label className="rst-ingredient-modal__field">
          <span>
            {isEdit
              ? t('rst.nomenclature.stockQtyLabel')
              : t('rst.nomenclature.stockQtyCreateLabel')}
          </span>
          <input
            type="number"
            min="0"
            step="any"
            value={form.stockQuantity}
            onChange={(e) => onChange('stockQuantity', e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="rst-ingredient-modal__field">
          <span>{t('productModal.lowStock')}</span>
          <input
            type="number"
            min="0"
            value={form.lowStockAlert}
            onChange={(e) => onChange('lowStockAlert', e.target.value)}
          />
        </label>
      </div>
      <p className="rst-ingredient-modal__hint">
        {isEdit
          ? t('rst.nomenclature.stockQtyEditHint')
          : t('rst.nomenclature.stockQtyCreateHint')}
      </p>
    </div>
  );
}
