import { Plus } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';

function FlagBadge({ on, yes, no }) {
  return (
    <span className={`business-constructor__badge${on ? ' business-constructor__badge--on' : ''}`}>
      {on ? yes : no}
    </span>
  );
}

export default function PlatformBusinessTypeFieldsTable({
  t,
  fields = [],
  detailLoading,
  onAddField,
  onEditField,
  onDeleteField,
}) {
  return (
    <>
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
    </>
  );
}
