import { BaseButton } from '../../../../components/ui';
import { CATALOG_FORM_FIELD_DEFS } from '../../../../config/productCatalogFormFields';

export default function PlatformBusinessTypeFormFields({
  t,
  detail,
  formFields = [],
  onToggle,
  onSave,
  saving,
}) {
  if (!detail) return null;

  const byKey = Object.fromEntries(formFields.map((row) => [row.ruleKey, row]));

  return (
    <section className="business-constructor__panel business-constructor__panel--wide">
      <div className="business-constructor__panel-head">
        <div>
          <h3 className="business-constructor__section-title">
            {t('platform.businessTypes.formFieldsTitle')}
          </h3>
          <p className="business-constructor__panel-hint">
            {t('platform.businessTypes.formFieldsHint')}
          </p>
        </div>
        <BaseButton size="sm" disabled={saving} onClick={onSave}>
          {t('common.save')}
        </BaseButton>
      </div>
      <div className="business-constructor__form-fields">
        {CATALOG_FORM_FIELD_DEFS.map((def) => {
          const row = byKey[def.ruleKey];
          const enabled = row ? row.enabled !== false : true;
          return (
            <label key={def.ruleKey} className="business-constructor__row business-constructor__check">
              <span>{t(def.labelKey)}</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => onToggle(def.ruleKey)}
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}
