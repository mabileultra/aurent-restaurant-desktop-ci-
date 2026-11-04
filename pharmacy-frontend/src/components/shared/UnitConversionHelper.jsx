import { useMemo, useState } from 'react';
import { BaseSelect } from '../ui';
import { getUnitConfig } from '../../utils/unitConfig';
import {
  coilLengthToMeters,
  convertToStockUnit,
  inputAlternativesForStockUnit,
} from '../../utils/unitConversionHelpers';
import '../../styles/shared/unit-conversion-helper.css';

export default function UnitConversionHelper({
  t,
  stockUnitCode = 'KG',
  standardLength,
  onApplyStockQty,
}) {
  const alternatives = useMemo(
    () => inputAlternativesForStockUnit(stockUnitCode),
    [stockUnitCode]
  );
  const stockLabel = getUnitConfig(stockUnitCode).label;
  const showCoil = stockUnitCode === 'M' && Number(standardLength) > 0;
  const [altCode, setAltCode] = useState('');
  const [altQty, setAltQty] = useState('');
  const [coilCount, setCoilCount] = useState('');

  if (!alternatives.length && !showCoil) return null;

  const handleApplyAlt = () => {
    const q = Number(String(altQty).replace(',', '.'));
    if (!altCode || !Number.isFinite(q) || q <= 0) return;
    const converted = convertToStockUnit(altCode, stockUnitCode, q);
    if (converted == null || converted <= 0) return;
    onApplyStockQty(converted);
    setAltQty('');
  };

  const handleApplyCoil = () => {
    const m = coilLengthToMeters(coilCount, standardLength);
    if (m == null || m <= 0) return;
    onApplyStockQty(m);
    setCoilCount('');
  };

  return (
    <div className="unit-conversion-helper">
      <p className="unit-conversion-helper__title">
        {t('unitConversion.helperTitle', { unit: stockLabel })}
      </p>

      {alternatives.length > 0 ? (
        <div className="unit-conversion-helper__row">
          <div className="unit-conversion-helper__field">
            <BaseSelect
              label={t('unitConversion.altUnit')}
              value={altCode}
              onChange={(e) => setAltCode(e.target.value)}
              placeholder={t('unitConversion.pickUnit')}
              options={[
                { value: '', label: t('unitConversion.pickUnit') },
                ...alternatives.map((a) => ({ value: a.fromCode, label: a.label })),
              ]}
            />
          </div>
          <label className="unit-conversion-helper__field unit-conversion-helper__field--qty">
            <span className="unit-conversion-helper__label">{t('unitConversion.qty')}</span>
            <input
              type="text"
              inputMode="decimal"
              value={altQty}
              onChange={(e) => setAltQty(e.target.value)}
              className="unit-conversion-helper__input"
            />
          </label>
          <button
            type="button"
            onClick={handleApplyAlt}
            disabled={!altCode || !altQty}
            className="unit-conversion-helper__apply"
          >
            {t('unitConversion.apply')}
          </button>
        </div>
      ) : null}

      {showCoil ? (
        <div className="unit-conversion-helper__row">
          <label className="unit-conversion-helper__field unit-conversion-helper__field--qty">
            <span className="unit-conversion-helper__label">{t('unitConversion.coilCount')}</span>
            <input
              type="text"
              inputMode="numeric"
              value={coilCount}
              onChange={(e) => setCoilCount(e.target.value)}
              placeholder="10"
              className="unit-conversion-helper__input"
            />
          </label>
          <p className="unit-conversion-helper__coil-hint">
            {t('unitConversion.coilLength', { length: standardLength })}
          </p>
          <button
            type="button"
            onClick={handleApplyCoil}
            disabled={!coilCount}
            className="unit-conversion-helper__apply"
          >
            {t('unitConversion.applyCoil')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
