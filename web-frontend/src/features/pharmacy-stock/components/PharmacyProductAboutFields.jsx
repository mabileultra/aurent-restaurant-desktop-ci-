import { X } from 'lucide-react';
import { usePharmacyCatalogOptions } from '../hooks/usePharmacyCatalogOptions';
import PharmacyPackageField from './PharmacyPackageField';

/** Карточка товара: одинаковая сетка для создания, «О товаре» и редактирования. */
export default function PharmacyProductAboutFields({
  t,
  form,
  patch,
  mxikQuery,
  setMxikQuery,
  mxikResults = [],
  mxikLoading = false,
  onSearchMxik,
  onPickMxik,
  onChoosePackage,
  onCreateBarcode,
  showActive = false,
}) {
  const options = usePharmacyCatalogOptions(true);
  const req = (label) => (
    <>
      {label}
      <span className="pharm-product-modal__req"> *</span>
    </>
  );

  return (
    <div className="pharm-about">
      <label className="pharm-product-modal__field">
        <span className="pharm-product-modal__label">{req(t('pharmacyStock.colName'))}</span>
        <input
          className="pharm-product-modal__input"
          value={form.name}
          onChange={(e) => patch('name', e.target.value)}
        />
      </label>

      <div className="pharm-product-modal__field pharm-product-modal__field--relative">
        <span className="pharm-product-modal__label">{t('pharmacyStock.productMxik')}</span>
        <div className="pharm-product-modal__inline">
          <input
            className="pharm-product-modal__input"
            value={mxikQuery || form.ikpu}
            onChange={(e) => {
              setMxikQuery(e.target.value);
              patch('ikpu', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchMxik?.();
              }
            }}
            placeholder={t('pharmacyStock.productMxikPh')}
          />
          <button
            type="button"
            className="pharm-product-modal__side-btn"
            onClick={onSearchMxik}
            disabled={mxikLoading}
          >
            {mxikLoading ? '…' : t('common.search')}
          </button>
        </div>
        {mxikResults.length > 0 ? (
          <ul className="pharm-product-modal__suggest">
            {mxikResults.map((item) => {
              const code = item?.mxik || item?.code || item?.ikpu || '';
              const label = item?.name || item?.title || code;
              return (
                <li key={code + label}>
                  <button type="button" onClick={() => onPickMxik?.(item)}>
                    <span className="pharm-product-modal__suggest-code">{code}</span>
                    <span className="pharm-product-modal__suggest-name">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <PharmacyPackageField t={t} form={form} onChoose={() => onChoosePackage?.(form.ikpu)} />

      <div className="pharm-product-modal__field">
        <span className="pharm-product-modal__label">{t('pharmacyStock.productBarcodes')}</span>
        <div className="pharm-product-modal__inline">
          <input
            className="pharm-product-modal__input"
            value={form.barcode}
            onChange={(e) => patch('barcode', e.target.value)}
            placeholder={t('pharmacyStock.productBarcodePrimary')}
          />
          <button
            type="button"
            className="pharm-product-modal__side-btn"
            onClick={onCreateBarcode}
          >
            {t('pharmacyStock.productBarcodeCreate')}
          </button>
        </div>
        {(form.additionalBarcodes || []).length > 0 ? (
          <div className="pharm-product-modal__extra">
            {(form.additionalBarcodes || []).map((code, idx) => (
              <div key={`bc-${idx}`} className="pharm-product-modal__inline">
                <input
                  className="pharm-product-modal__input"
                  value={code}
                  onChange={(e) => {
                    const next = [...form.additionalBarcodes];
                    next[idx] = e.target.value;
                    patch('additionalBarcodes', next);
                  }}
                  placeholder={t('pharmacyStock.productBarcodeExtra')}
                />
                <button
                  type="button"
                  className="pharm-product-modal__icon-btn"
                  onClick={() => {
                    patch(
                      'additionalBarcodes',
                      form.additionalBarcodes.filter((_, i) => i !== idx),
                    );
                  }}
                  aria-label={t('common.delete')}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pharm-about__row">
        <label className="pharm-product-modal__field">
          <span className="pharm-product-modal__label">{t('pharmacyStock.colManufacturer')}</span>
          <input
            className="pharm-product-modal__input"
            list="pharm-mfr-list"
            value={form.manufacturer}
            onChange={(e) => patch('manufacturer', e.target.value)}
          />
          <datalist id="pharm-mfr-list">
            {options.manufacturers.map((v) => <option key={v} value={v} />)}
          </datalist>
        </label>
        <label className="pharm-product-modal__field">
          <span className="pharm-product-modal__label">{t('pharmacyStock.colForm')}</span>
          <input
            className="pharm-product-modal__input"
            list="pharm-form-list"
            value={form.dosageForm}
            onChange={(e) => patch('dosageForm', e.target.value)}
          />
          <datalist id="pharm-form-list">
            {options.forms.map((v) => <option key={v} value={v} />)}
          </datalist>
        </label>
      </div>

      <div className="pharm-about__row">
        <label className="pharm-product-modal__field">
          <span className="pharm-product-modal__label">{t('pharmacyStock.colCountry')}</span>
          <input
            className="pharm-product-modal__input"
            value={form.country}
            onChange={(e) => patch('country', e.target.value)}
          />
        </label>
        <label className="pharm-product-modal__field">
          <span className="pharm-product-modal__label">{t('pharmacyStock.colShelf')}</span>
          <input
            className="pharm-product-modal__input"
            value={form.storageLocation}
            onChange={(e) => patch('storageLocation', e.target.value)}
            placeholder={t('pharmacyStock.colShelfPh')}
          />
        </label>
      </div>

      <div className="pharm-about__row">
        <label className="pharm-product-modal__field">
          <span className="pharm-product-modal__label">{req(t('pharmacyStock.unitsInPack'))}</span>
          <input
            inputMode="numeric"
            className="pharm-product-modal__input pharm-line-modal__input--num"
            value={form.unitsInPack}
            onChange={(e) => patch('unitsInPack', e.target.value)}
          />
        </label>
      </div>

      {Number(form.unitsInPack) > 1 ? (
        <div className="pharm-about__sale">
          <p className="pharm-product-modal__section-hint">{t('pharmacyStock.productSaleSection')}</p>
          <label className="pharm-product-modal__check">
            <input
              type="checkbox"
              checked={Boolean(form.doNotSellByPiece)}
              onChange={(e) => patch('doNotSellByPiece', e.target.checked)}
            />
            <span>
              <span className="pharm-product-modal__check-title">{t('pharmacyStock.productNoPieceSale')}</span>
              <span className="pharm-product-modal__check-hint">{t('pharmacyStock.productNoPieceSaleHint')}</span>
            </span>
          </label>
          {!form.doNotSellByPiece ? (
            <label className="pharm-product-modal__field">
              <span className="pharm-product-modal__label">{t('pharmacyStock.productPieceStep')}</span>
              <input
                inputMode="numeric"
                className="pharm-product-modal__input pharm-line-modal__input--num"
                value={form.pieceStep}
                onChange={(e) => patch('pieceStep', e.target.value)}
                placeholder="1"
              />
              <span className="pharm-product-modal__check-hint">{t('pharmacyStock.productPieceStepHint')}</span>
            </label>
          ) : null}
        </div>
      ) : null}

      <label className="pharm-product-modal__field">
        <span className="pharm-product-modal__label">{t('pharmacyStock.productAtc')}</span>
        <input
          className="pharm-product-modal__input"
          list="pharm-atc-list"
          value={form.atcCode}
          onChange={(e) => patch('atcCode', e.target.value)}
          placeholder={t('pharmacyStock.productAtcPh')}
        />
        <datalist id="pharm-atc-list">
          {options.atcCodes.map((v) => <option key={v} value={v} />)}
        </datalist>
      </label>

      <label className="pharm-product-modal__check">
        <input
          type="checkbox"
          checked={Boolean(form.prescriptionRequired)}
          onChange={(e) => patch('prescriptionRequired', e.target.checked)}
        />
        <span>{t('pharmacyStock.productPrescription')}</span>
      </label>

      <label className="pharm-product-modal__check">
        <input
          type="checkbox"
          checked={Boolean(form.markedProduct)}
          onChange={(e) => patch('markedProduct', e.target.checked)}
        />
        <span>{t('pharmacyStock.productMarked')}</span>
      </label>

      {showActive ? (
        <label className="pharm-product-modal__check">
          <input
            type="checkbox"
            checked={form.active !== false}
            onChange={(e) => patch('active', e.target.checked)}
          />
          <span>{t('pharmacyStock.productActive')}</span>
        </label>
      ) : null}
    </div>
  );
}
