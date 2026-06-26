import { ToggleLeft, ToggleRight } from 'lucide-react';
import { BaseButton, BaseInput, BaseModal, BaseSelect, inputCls } from '../../../../components/ui';
import { BUSINESS_TYPE_FIELD_TYPES } from '../../utils/businessTypeUtils';

export default function PlatformBusinessFieldFormModal({
  t,
  modal,
  form,
  referenceBooks = [],
  onClose,
  onFieldChange,
  onSave,
  saving,
}) {
  if (!modal) return null;

  const title =
    modal.mode === 'create' ? t('platform.businessTypes.addField') : t('common.edit');
  const usesReferenceBook = form.fieldType === 'LIST' && Boolean(form.referenceBookId);

  return (
    <BaseModal onClose={onClose} title={title} size="lg">
      <div className="space-y-3">
        {modal.mode === 'create' ? (
          <BaseInput
            placeholder={t('platform.businessTypes.fieldKeyPh')}
            value={form.fieldKey}
            onChange={(e) => onFieldChange({ fieldKey: e.target.value })}
          />
        ) : null}
        <BaseInput
          placeholder={t('platform.businessTypes.fieldLabelPh')}
          value={form.label}
          onChange={(e) => onFieldChange({ label: e.target.value })}
        />
        <BaseSelect
          value={form.fieldType}
          onChange={(e) => onFieldChange({ fieldType: e.target.value })}
          options={BUSINESS_TYPE_FIELD_TYPES.map((type) => ({
            value: type,
            label: type,
          }))}
        />
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => onFieldChange({ required: e.target.checked })}
            />
            {t('platform.businessTypes.required')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => onFieldChange({ enabled: e.target.checked })}
            />
            {form.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {t('platform.businessTypes.enabled')}
          </label>
          {form.fieldType === 'LIST' ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.filterable}
                onChange={(e) => onFieldChange({ filterable: e.target.checked })}
              />
              {t('platform.businessTypes.filterable')}
            </label>
          ) : null}
        </div>
        <BaseInput
          type="number"
          placeholder={t('platform.businessTypes.sortPh')}
          value={form.sortOrder}
          onChange={(e) => onFieldChange({ sortOrder: e.target.value })}
        />
        <BaseInput
          placeholder={t('platform.businessTypes.placeholderPh')}
          value={form.placeholder}
          onChange={(e) => onFieldChange({ placeholder: e.target.value })}
        />
        {form.fieldType === 'LIST' ? (
          <>
            <BaseSelect
              label={t('platform.businessTypes.referenceBook')}
              value={form.referenceBookId}
              onChange={(e) => onFieldChange({ referenceBookId: e.target.value })}
              placeholder={t('platform.businessTypes.referenceBookInline')}
              options={[
                { value: '', label: t('platform.businessTypes.referenceBookInline') },
                ...referenceBooks.map((book) => ({
                  value: String(book.id),
                  label: `${book.name} (${book.code})`,
                })),
              ]}
            />
            {!usesReferenceBook ? (
              <textarea
                className={inputCls}
                rows={4}
                placeholder={t('platform.businessTypes.optionsPh')}
                value={form.optionsText}
                onChange={(e) => onFieldChange({ optionsText: e.target.value })}
              />
            ) : (
              <p className="text-xs text-slate-500">{t('platform.businessTypes.referenceBookHint')}</p>
            )}
          </>
        ) : null}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <BaseButton variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </BaseButton>
        <BaseButton onClick={onSave} disabled={saving}>
          {t('common.save')}
        </BaseButton>
      </div>
    </BaseModal>
  );
}
