export default function PharmacyPackageField({ t, form, onChoose }) {
  const code = String(form.packageCode || '').trim();
  return (
    <div className="pharm-product-modal__field">
      <span className="pharm-product-modal__label">{t('pharmacyStock.packageCode')}</span>
      <div className="pharm-product-modal__inline">
        <input
          className="pharm-product-modal__input"
          value={code ? `${code}${form.packageName ? ` — ${form.packageName}` : ''}` : ''}
          readOnly
          placeholder={t('pharmacyStock.packageCodeEmpty')}
        />
        <button type="button" className="pharm-product-modal__side-btn" onClick={onChoose}>
          {t('pharmacyStock.packageChoose')}
        </button>
      </div>
    </div>
  );
}
