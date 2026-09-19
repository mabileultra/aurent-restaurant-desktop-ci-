import { Plus, Trash2 } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import PlatformBusinessTypeUnitsRules from './PlatformBusinessTypeUnitsRules';
import PlatformBusinessTypePriceDisplayRules from './PlatformBusinessTypePriceDisplayRules';
import PlatformBusinessTypeFormFields from './PlatformBusinessTypeFormFields';

function FlagBadge({ on, yes, no }) {
  return (
    <span className={`business-constructor__badge${on ? ' business-constructor__badge--on' : ''}`}>
      {on ? yes : no}
    </span>
  );
}

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

      <div className="business-constructor__section-head">
        <h3 className="business-constructor__section-title">
          {t('platform.businessTypes.fieldsTitle')}
        </h3>
        <BaseButton size="sm" onClick={onAddField}>
          <Plus size={14} />
          {t('platform.businessTypes.addField')}
        </BaseButton>
      </div>

      <div className="business-constructor__table-wrap">
        <table className="business-constructor__table">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th>{t('platform.businessTypes.colLabel')}</th>
              <th>{t('platform.businessTypes.colKey')}</th>
              <th>{t('platform.businessTypes.colType')}</th>
              <th>{t('platform.businessTypes.colRequired')}</th>
              <th>{t('platform.businessTypes.colEnabled')}</th>
              <th className="business-constructor__row-actions">{t('categories.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {detailLoading ? (
              <tr>
                <td colSpan={8} className="business-constructor__muted">{t('common.loading')}</td>
              </tr>
            ) : fields.length === 0 ? (
              <tr>
                <td colSpan={8} className="business-constructor__muted">{t('platform.businessTypes.noFields')}</td>
              </tr>
            ) : (
              fields.map((field, index) => (
                <tr key={field.id}>
                  <AdminTableNoIdCells
                    page={0}
                    pageSize={fields.length || 1}
                    index={index}
                    id={field.id}
                  />
                  <td>{field.label}</td>
                  <td className="business-constructor__key">{field.fieldKey}</td>
                  <td>{field.fieldType}</td>
                  <td>
                    <FlagBadge on={field.required} yes={t('common.yes')} no={t('common.no')} />
                  </td>
                  <td>
                    <FlagBadge on={field.enabled} yes={t('common.yes')} no={t('common.no')} />
                  </td>
                  <td className="business-constructor__row-actions">
                    <button type="button" className="business-constructor__link" onClick={() => onEditField(field)}>
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      className="business-constructor__link--danger"
                      onClick={() => onDeleteField(field)}
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onToggleFormField ? (
        <PlatformBusinessTypeFormFields
          t={t}
          detail={detail}
          formFields={formFields}
          onToggle={onToggleFormField}
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
