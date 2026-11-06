import { encodeWeightBarcode } from '../utils/weightBarcode';
import { fmtMoney } from '../../../utils/formatMoney';

export default function ScalesWeightPanel({ t, product, weightKg, stable, printing, lastBarcode, onPrint, autoPrint }) {
  const kg = Number(weightKg);
  const ready = Boolean(product?.plu) && Number.isFinite(kg) && kg > 0;
  let barcode = '';
  try {
    barcode = ready ? encodeWeightBarcode(product.plu, kg) : '';
  } catch {
    barcode = '';
  }
  const total = ready ? Math.round(Number(product.sellingPrice || 0) * kg * 100) / 100 : null;

  return (
    <div className="scales-weight-panel">
      <div className="scales-weight-panel__row">
        <div>
          <p className="scales-weight-panel__label">{t('scales.weight')}</p>
          <p className="scales-weight-panel__value">
            {Number.isFinite(kg) ? kg.toFixed(3) : '—'} <span>кг</span>
          </p>
        </div>
        <div>
          <p className="scales-weight-panel__label">{t('scales.lineTotal')}</p>
          <p className="scales-weight-panel__value">{total != null ? fmtMoney(total) : '—'}</p>
        </div>
      </div>

      <p className="scales-weight-panel__barcode">
        {barcode || t('scales.barcodePending')}
      </p>

      <div className="scales-weight-panel__actions">
        <label className="scales-weight-panel__auto">
          <input type="checkbox" checked={autoPrint} onChange={(e) => onPrint?.({ toggleAuto: e.target.checked })} />
          {t('scales.autoPrint')}
        </label>
        <button
          type="button"
          className="scales-btn scales-btn--primary"
          disabled={!ready || !stable || printing}
          onClick={() => onPrint?.({ force: true })}
        >
          {printing ? t('scales.printing') : t('scales.printLabel')}
        </button>
      </div>

      {lastBarcode ? (
        <p className="scales-weight-panel__hint">
          {t('scales.lastPrinted')}: {lastBarcode}
        </p>
      ) : null}
    </div>
  );
}
