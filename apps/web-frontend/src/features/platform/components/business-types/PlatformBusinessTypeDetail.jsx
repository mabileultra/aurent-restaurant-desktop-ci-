import { Trash2 } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import PlatformBusinessTypeUnitsRules from './PlatformBusinessTypeUnitsRules';
import PlatformBusinessTypePriceDisplayRules from './PlatformBusinessTypePriceDisplayRules';
import PlatformBusinessTypeFormFields from './PlatformBusinessTypeFormFields';
import PlatformBusinessTypeFieldsTable from './PlatformBusinessTypeFieldsTable';

export default function PlatformBusinessTypeDetail({
  t,
  detail,
  detailLoading,
  fields,
  catalogUnits = [],
  unitCodes = [],
  defaultUnitCode,
  rules = [],
  priceRules = [],
  displayRules = [],
  formFields = [],
  onEditType,
  onDeleteType,
  onAddField,
  onEditField,
  onDeleteField,
  onToggleUnit,
  onSetDefaultUnit,
  onToggleRule,
  onToggleFormField,
  onSetFormFieldGroup,
  onPriceRuleChange,
  onAddDisplayRule,
  onDisplayRuleChange,
  onRemoveDisplayRule,
  onSaveUnits,
  onSaveRules,
  onSaveFormFields,
  onSavePriceRules,
  onSaveDisplayRules,
  savingUnits,
  savingRules,
  savingFormFields,
  savingPriceRules,
  savingDisplayRules,
}) {
  if (!detail) {
    return (
      <section className="business-constructor__card">
        <p className="business-constructor__empty">{t('platform.businessTypes.selectType')}</p>
      </section>
    );
  }

  return (
    <section className="business-constructor__card">
      <div className="business-constructor__hero">
        <div>
          <h2 className="business-constructor__title">{detail.name}</h2>
          <span className="business-constructor__code">{detail.code}</span>
          {detail.description ? (
            <p className="business-constructor__desc">{detail.description}</p>
          ) : null}
        </div>
        <div className="business-constructor__actions">
          <BaseButton variant="secondary" size="sm" onClick={onEditType}>
            {t('common.edit')}
          </BaseButton>
          {detail.code !== 'UNIVERSAL' ? (
            <BaseButton
              variant="secondary"
              size="sm"
              className="business-constructor__danger"
              onClick={onDeleteType}
            >
              <Trash2 size={14} />
              {t('common.delete')}
            </BaseButton>
          ) : null}
        </div>
      </div>

      <PlatformBusinessTypeFieldsTable
        t={t}
        fields={fields}
        detailLoading={detailLoading}
        onAddField={onAddField}
        onEditField={onEditField}
        onDeleteField={onDeleteField}
      />

      {onToggleFormField ? (
        <PlatformBusinessTypeFormFields
          t={t}
          detail={detail}
          formFields={formFields}
          onToggle={onToggleFormField}
          onSetGroup={onSetFormFieldGroup}
          onSave={onSaveFormFields}
          saving={savingFormFields}
        />
      ) : null}

      {onToggleUnit ? (
        <PlatformBusinessTypeUnitsRules
          t={t}
          detail={detail}
          catalogUnits={catalogUnits}
          unitCodes={unitCodes}
          defaultUnitCode={defaultUnitCode}
          rules={rules}
          onToggleUnit={onToggleUnit}
          onSetDefaultUnit={onSetDefaultUnit}
          onToggleRule={onToggleRule}
          onSaveUnits={onSaveUnits}
          onSaveRules={onSaveRules}
          savingUnits={savingUnits}
          savingRules={savingRules}
        />
      ) : null}

      {onPriceRuleChange ? (
        <PlatformBusinessTypePriceDisplayRules
          t={t}
          fields={fields}
          priceRules={priceRules}
          displayRules={displayRules}
          onPriceRuleChange={onPriceRuleChange}
          onDisplayRuleChange={onDisplayRuleChange}
          onAddDisplayRule={onAddDisplayRule}
          onRemoveDisplayRule={onRemoveDisplayRule}
          onSavePriceRules={onSavePriceRules}
          onSaveDisplayRules={onSaveDisplayRules}
          savingPriceRules={savingPriceRules}
          savingDisplayRules={savingDisplayRules}
        />
      ) : null}
    </section>
  );
}
