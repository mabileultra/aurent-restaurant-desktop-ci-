import { BaseButton } from '../../../../components/ui';
import {
  CATALOG_FORM_FIELD_DEFS,
  CATALOG_FORM_FIELD_GROUPS,
  defsForGroup,
} from '../../../../config/productCatalogFormFields';
import PlatformBusinessTypeFormFieldGroup from './PlatformBusinessTypeFormFieldGroup';

export default function PlatformBusinessTypeFormFields({
  t,
  detail,
  formFields = [],
  onToggle,
  onSetGroup,
  onSave,
  saving,
}) {
  if (!detail) return null;

  const byKey = Object.fromEntries(formFields.map((row) => [row.ruleKey, row]));

  return (
    <section className="business-constructor__panel business-constructor__panel--wide business-constructor__form-panel">
      <div className="business-constructor__panel-head">
        <div>
          <h3 className="business-constructor__section-title">
            {t('platform.businessTypes.formFieldsTitle')}
          </h3>
          <p className="business-constructor__panel-hint">
            {t('platform.businessTypes.formFieldsHint')}
          </p>
          <p className="business-constructor__panel-hint">
            {t('platform.businessTypes.formFieldsNameAlways')}
          </p>
        </div>
        <BaseButton size="sm" disabled={saving} onClick={onSave}>
          {t('common.save')}
        </BaseButton>
      </div>

      <div className="business-constructor__form-grid">
        {CATALOG_FORM_FIELD_GROUPS.map((group) => {
          const defs = defsForGroup(group.id);
          if (!defs.length) return null;
          return (
            <PlatformBusinessTypeFormFieldGroup
              key={group.id}
              t={t}
              group={group}
              defs={defs}
              byKey={byKey}
              onToggle={onToggle}
              onSetGroup={onSetGroup}
            />
          );
        })}
      </div>

      <p className="business-constructor__form-meta">
        {t('platform.businessTypes.formFieldsCount', { count: CATALOG_FORM_FIELD_DEFS.length })}
      </p>
    </section>
  );
}
