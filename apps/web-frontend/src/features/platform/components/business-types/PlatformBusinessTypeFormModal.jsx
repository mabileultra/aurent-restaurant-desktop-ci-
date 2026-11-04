import { Save } from 'lucide-react';
import { BaseButton, BaseInput, BaseModal, inputCls } from '../../../../components/ui';

export default function PlatformBusinessTypeFormModal({
  t,
  modal,
  onClose,
  onFieldChange,
  onSave,
  saving,
}) {
  if (!modal) return null;

  const title = modal.mode === 'create' ? t('platform.businessTypes.addType') : t('common.edit');

  return (
    <BaseModal onClose={onClose} title={title} size="md">
      <div className="business-constructor__modal">
        {modal.mode === 'create' ? (
          <BaseInput
            label={t('platform.businessTypes.codePh')}
            placeholder={t('platform.businessTypes.codePh')}
            value={modal.form.code}
            onChange={(e) => onFieldChange({ code: e.target.value.toUpperCase() })}
          />
        ) : null}
        <BaseInput
          label={t('platform.businessTypes.namePh')}
          placeholder={t('platform.businessTypes.namePh')}
          value={modal.form.name}
          onChange={(e) => onFieldChange({ name: e.target.value })}
        />
        <textarea
          className={inputCls}
          rows={3}
          aria-label={t('platform.businessTypes.descriptionPh')}
          placeholder={t('platform.businessTypes.descriptionPh')}
          value={modal.form.description}
          onChange={(e) => onFieldChange({ description: e.target.value })}
        />
        <label className="business-constructor__check">
          <input
            type="checkbox"
            checked={modal.form.active}
            onChange={(e) => onFieldChange({ active: e.target.checked })}
          />
          {t('platform.businessTypes.active')}
        </label>
      </div>
      <div className="business-constructor__modal-actions">
        <BaseButton variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </BaseButton>
        <BaseButton onClick={onSave} disabled={saving}>
          <Save size={14} />
          {t('common.save')}
        </BaseButton>
      </div>
    </BaseModal>
  );
}
