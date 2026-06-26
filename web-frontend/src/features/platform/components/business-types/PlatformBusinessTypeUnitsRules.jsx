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
  unitCodes,
  defaultUnitCode,
  rules,
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
    <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('platform.businessTypes.unitsTitle')}
            </h3>
            <BaseButton size="sm" disabled={savingUnits || unitCodes.length === 0} onClick={onSaveUnits}>
              {t('common.save')}
            </BaseButton>
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            {catalogUnits.map((unit) => {
              const checked = unitCodes.includes(unit.code);
              const isDefault = defaultUnitCode === unit.code;
              return (
                <label
                  key={unit.code}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleUnit(unit.code)}
                    />
                    <span>{unit.labelRu}</span>
                    <span className="font-mono text-xs text-slate-400">{unit.code}</span>
                  </span>
                  {checked ? (
                    <button
                      type="button"
                      className={`rounded px-2 py-0.5 text-xs ${
                        isDefault
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => onSetDefaultUnit(unit.code)}
                    >
                      {isDefault ? t('platform.businessTypeDefault') : t('platform.businessTypeMakeDefault')}
                    </button>
                  ) : null}
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('platform.businessTypes.rulesTitle')}
            </h3>
            <BaseButton size="sm" disabled={savingRules} onClick={onSaveRules}>
              {t('common.save')}
            </BaseButton>
          </div>
          <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            {rules.map((rule) => (
              <label
                key={rule.ruleKey}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <span className="text-sm text-slate-800 dark:text-slate-200">
                  {t(RULE_LABEL_KEYS[rule.ruleKey] ?? rule.ruleKey)}
                </span>
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
    </div>
  );
}
