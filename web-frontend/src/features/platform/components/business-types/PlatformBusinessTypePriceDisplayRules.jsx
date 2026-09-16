import { BaseButton, BaseInput, BaseSelect } from '../../../../components/ui';

const PRICE_RULE_LABEL_KEYS = {
  'price.requireCost': 'platform.businessTypes.priceRequireCost',
  'price.hideCost': 'platform.businessTypes.priceHideCost',
  'price.hideInitialStock': 'platform.businessTypes.priceHideInitialStock',
  'price.minMarginPercent': 'platform.businessTypes.priceMinMargin',
  'price.maxDiscountPercent': 'platform.businessTypes.priceMaxDiscount',
};

const OPERATORS = ['EQUALS', 'NOT_EQUALS', 'NOT_EMPTY', 'EMPTY'];
const EFFECTS = ['SHOW', 'HIDE', 'REQUIRE'];

export default function PlatformBusinessTypePriceDisplayRules({
  t,
  fields = [],
  priceRules = [],
  displayRules = [],
  onPriceRuleChange,
  onDisplayRuleChange,
  onAddDisplayRule,
  onRemoveDisplayRule,
  onSavePriceRules,
  onSaveDisplayRules,
  savingPriceRules,
  savingDisplayRules,
}) {
  const fieldOptions = fields.map((field) => ({ value: field.fieldKey, label: field.label }));

  return (
    <div className="business-constructor__panels">
      <section className="business-constructor__panel">
        <div className="business-constructor__panel-head">
          <h3 className="business-constructor__section-title">{t('platform.businessTypes.priceRulesTitle')}</h3>
          <BaseButton size="sm" disabled={savingPriceRules} onClick={onSavePriceRules}>
            {t('common.save')}
          </BaseButton>
        </div>
        <div className="business-constructor__scroll">
          {priceRules.map((rule) => (
            <div key={rule.ruleKey} className="business-constructor__row">
              <span className="business-constructor__check">
                {t(PRICE_RULE_LABEL_KEYS[rule.ruleKey] ?? rule.ruleKey)}
              </span>
              {rule.numeric ? (
                <BaseInput
                  type="number"
                  className="business-constructor__number"
                  value={rule.ruleValue}
                  onChange={(e) => onPriceRuleChange(rule.ruleKey, e.target.value)}
                />
              ) : (
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => onPriceRuleChange(rule.ruleKey, e.target.checked ? 'true' : 'false')}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="business-constructor__panel">
        <div className="business-constructor__panel-head">
          <h3 className="business-constructor__section-title">{t('platform.businessTypes.displayRulesTitle')}</h3>
          <div className="business-constructor__panel-actions">
            <BaseButton size="sm" variant="secondary" onClick={onAddDisplayRule}>
              {t('platform.businessTypes.addDisplayRule')}
            </BaseButton>
            <BaseButton size="sm" disabled={savingDisplayRules} onClick={onSaveDisplayRules}>
              {t('common.save')}
            </BaseButton>
          </div>
        </div>
        {displayRules.length === 0 ? (
          <p className="business-constructor__empty">{t('platform.businessTypes.noDisplayRules')}</p>
        ) : (
          displayRules.map((rule, index) => (
            <div key={rule.id ?? index} className="business-constructor__rule">
              <div className="business-constructor__rule-grid">
                <BaseSelect
                  label={t('platform.businessTypes.displayTarget')}
                  value={rule.targetFieldKey}
                  onChange={(e) => onDisplayRuleChange(index, { targetFieldKey: e.target.value })}
                  options={fieldOptions}
                />
                <BaseSelect
                  label={t('platform.businessTypes.displayTrigger')}
                  value={rule.triggerFieldKey}
                  onChange={(e) => onDisplayRuleChange(index, { triggerFieldKey: e.target.value })}
                  options={fieldOptions}
                />
              </div>
              <div className="business-constructor__rule-grid business-constructor__rule-grid--wide">
                <BaseSelect
                  label={t('platform.businessTypes.displayOperator')}
                  value={rule.operator}
                  onChange={(e) => onDisplayRuleChange(index, { operator: e.target.value })}
                  options={OPERATORS.map((op) => ({ value: op, label: op }))}
                />
                <BaseInput
                  label={t('platform.businessTypes.displayValue')}
                  value={rule.triggerValue ?? ''}
                  onChange={(e) => onDisplayRuleChange(index, { triggerValue: e.target.value })}
                />
                <BaseSelect
                  label={t('platform.businessTypes.displayEffect')}
                  value={rule.effect}
                  onChange={(e) => onDisplayRuleChange(index, { effect: e.target.value })}
                  options={EFFECTS.map((effect) => ({ value: effect, label: effect }))}
                />
              </div>
              <button
                type="button"
                className="business-constructor__link--danger"
                onClick={() => onRemoveDisplayRule(index)}
              >
                {t('common.delete')}
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
