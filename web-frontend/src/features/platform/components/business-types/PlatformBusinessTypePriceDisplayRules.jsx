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
  return (
    <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('platform.businessTypes.priceRulesTitle')}
            </h3>
            <BaseButton size="sm" disabled={savingPriceRules} onClick={onSavePriceRules}>
              {t('common.save')}
            </BaseButton>
          </div>
          <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            {priceRules.map((rule) => (
              <div
                key={rule.ruleKey}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <span className="text-sm text-slate-800 dark:text-slate-200">
                  {t(PRICE_RULE_LABEL_KEYS[rule.ruleKey] ?? rule.ruleKey)}
                </span>
                {rule.numeric ? (
                  <BaseInput
                    type="number"
                    className="w-24"
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

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('platform.businessTypes.displayRulesTitle')}
            </h3>
            <div className="flex gap-2">
              <BaseButton size="sm" variant="secondary" onClick={onAddDisplayRule}>
                {t('platform.businessTypes.addDisplayRule')}
              </BaseButton>
              <BaseButton size="sm" disabled={savingDisplayRules} onClick={onSaveDisplayRules}>
                {t('common.save')}
              </BaseButton>
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            {displayRules.length === 0 ? (
              <p className="text-sm text-slate-500">{t('platform.businessTypes.noDisplayRules')}</p>
            ) : (
              displayRules.map((rule, index) => (
                <div key={rule.id ?? index} className="space-y-2 rounded-md border border-slate-100 p-2 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <BaseSelect
                      label={t('platform.businessTypes.displayTarget')}
                      value={rule.targetFieldKey}
                      onChange={(e) => onDisplayRuleChange(index, { targetFieldKey: e.target.value })}
                      options={fields.map((f) => ({ value: f.fieldKey, label: f.label }))}
                    />
                    <BaseSelect
                      label={t('platform.businessTypes.displayTrigger')}
                      value={rule.triggerFieldKey}
                      onChange={(e) => onDisplayRuleChange(index, { triggerFieldKey: e.target.value })}
                      options={fields.map((f) => ({ value: f.fieldKey, label: f.label }))}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
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
                    className="text-xs text-red-600"
                    onClick={() => onRemoveDisplayRule(index)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
