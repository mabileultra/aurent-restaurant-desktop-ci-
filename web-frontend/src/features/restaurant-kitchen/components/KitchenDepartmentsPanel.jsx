import { Pencil, Plus, Trash2 } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import KitchenDepartmentFormModal from './KitchenDepartmentFormModal';
import '../styles/kitchen-departments-panel.css';

export default function KitchenDepartmentsPanel({
  t,
  canManage,
  departments,
  loading,
  modal,
  onOpenCreate,
  onOpenEdit,
  onConfirmDelete,
  onModalChange,
  onModalClose,
  onSave,
  saving,
}) {
  return (
    <div className="kitchen-departments-panel">
      <div className="kitchen-departments-panel__header">
        <h3 className="kitchen-departments-panel__title">{t('restaurantKitchen.departmentsSection')}</h3>
        {canManage ? (
          <BaseButton type="button" size="sm" onClick={onOpenCreate}>
            <Plus size={15} />
            {t('restaurantKitchen.addDepartment')}
          </BaseButton>
        ) : null}
      </div>

      {loading ? (
        <p className="kitchen-departments-panel__empty">{t('common.loading')}</p>
      ) : departments.length === 0 ? (
        <p className="kitchen-departments-panel__empty">{t('restaurantKitchen.noDepartments')}</p>
      ) : (
        <div className="kitchen-departments-panel__list">
          {departments.map((dep) => (
            <div key={dep.id} className="kitchen-departments-panel__item">
              <div className="kitchen-departments-panel__item-main">
                <span className="kitchen-departments-panel__item-label">{dep.label}</span>
                <span className="kitchen-departments-panel__item-code">{dep.value}</span>
              </div>
              {canManage ? (
                <div className="kitchen-departments-panel__item-actions">
                  <BaseButton type="button" variant="ghost" size="sm" onClick={() => onOpenEdit(dep)} title={t('common.edit')}>
                    <Pencil size={14} />
                  </BaseButton>
                  <BaseButton type="button" variant="ghost" size="sm" onClick={() => onConfirmDelete(dep)} title={t('common.delete')}>
                    <Trash2 size={14} />
                  </BaseButton>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <KitchenDepartmentFormModal
        open={!!modal}
        mode={modal?.mode}
        form={modal?.form ?? {}}
        onChange={onModalChange}
        onClose={onModalClose}
        onSubmit={onSave}
        isPending={saving}
        t={t}
      />
    </div>
  );
}
