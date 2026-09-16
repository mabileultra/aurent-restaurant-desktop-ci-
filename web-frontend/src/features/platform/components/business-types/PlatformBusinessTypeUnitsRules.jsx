import { BaseButton } from '../../../../components/ui';

const RULE_LABEL_KEYS = {
  'product.allowFraction': 'platform.businessTypes.ruleAllowFraction',
  'product.defaultWeightSale': 'platform.businessTypes.ruleDefaultWeightSale',
  'stock.trackExpiry': 'platform.businessTypes.ruleTrackExpiry',
  'stock.trackBatches': 'platform.businessTypes.ruleTrackBatches',
  'cashier.weightEntry': 'platform.businessTypes.ruleWeightEntry',
  'label.showWeight': 'platform.businessTypes.ruleShowWeight',
  'label.showSize': 'platform.businessTypes.ruleShowSize',
};

export default function PlatformBusinessTypeUnitsRules({
  t,
  detail,
  catalogUnits = [],
  unitCodes = [],
  defaultUnitCode,
  rules = [],
  onToggleUnit,
  onSetDefaultUnit,
  onToggleRule,
  onSaveUnits,
  onSaveRules,
  savingUnits,
  savingRules,
}) {
  if (!detail) return null;

  return (
    <div className="business-constructor__panels">
      <section className="business-constructor__panel">
        <div className="business-constructor__panel-head">
          <h3 className="business-constructor__section-title">{t('platform.businessTypes.unitsTitle')}</h3>
          <BaseButton size="sm" disabled={savingUnits || unitCodes.length === 0} onClick={onSaveUnits}>
            {t('common.save')}
          </BaseButton>
        </div>
        <div className="business-constructor__scroll">
          {catalogUnits.map((unit) => {
            const checked = unitCodes.includes(unit.code);
            const isDefault = defaultUnitCode === unit.code;
            return (
              <div key={unit.code} className="business-constructor__row">
                <label className="business-constructor__check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleUnit(unit.code)}
                  />
                  <span>{unit.labelRu}</span>
                  <span className="business-constructor__unit-code">{unit.code}</span>
                </label>
                {checked ? (
                  <button
                    type="button"
                    className={`business-constructor__default${isDefault ? ' is-on' : ''}`}
                    onClick={() => onSetDefaultUnit(unit.code)}
                  >
                    {isDefault ? t('platform.businessTypeDefault') : t('platform.businessTypeMakeDefault')}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="business-constructor__panel">
        <div className="business-constructor__panel-head">
          <h3 className="business-constructor__section-title">{t('platform.businessTypes.rulesTitle')}</h3>
          <BaseButton size="sm" disabled={savingRules} onClick={onSaveRules}>
            {t('common.save')}
          </BaseButton>
        </div>
        <div className="business-constructor__scroll">
          {rules.map((rule) => (
            <label key={rule.ruleKey} className="business-constructor__row business-constructor__check">
              <span>{t(RULE_LABEL_KEYS[rule.ruleKey] ?? rule.ruleKey)}</span>
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => onToggleRule(rule.ruleKey)}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
