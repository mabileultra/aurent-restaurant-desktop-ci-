import React from 'react';
import { BaseButton, BaseInput, BaseModal, BaseCheckbox } from '../../../components/ui';

export default function PlatformReferenceBookModal({
  modal,
  setModal,
  form,
  setForm,
  save,
  isPending,
  t,
  inputCls,
}) {
  if (!modal) return null;

  return (
    <BaseModal
      onClose={() => setModal(null)}
      title={modal.mode === 'create' ? t('platform.referenceBooks.add') : t('common.edit')}
      size="lg"
    >
      <div className="space-y-3">
        {modal.mode === 'create' ? (
          <BaseInput
            placeholder={t('platform.referenceBooks.codePh')}
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          />
        ) : (
          <p className="text-sm text-slate-500">
            {t('platform.referenceBooks.colCode')}: <span className="font-mono">{form.code}</span>
          </p>
        )}
        <BaseInput
          placeholder={t('platform.referenceBooks.namePh')}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <BaseInput
          placeholder={t('platform.referenceBooks.descriptionPh')}
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <BaseCheckbox
            checked={form.active}
            onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            size={18}
          />
          <span>{t('platform.referenceBooks.active')}</span>
        </label>
        <textarea
          className={inputCls}
          rows={6}
          placeholder={t('platform.referenceBooks.entriesPh')}
          value={form.entriesText}
          onChange={(e) => setForm((prev) => ({ ...prev, entriesText: e.target.value }))}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <BaseButton variant="secondary" onClick={() => setModal(null)}>
          {t('common.cancel')}
        </BaseButton>
        <BaseButton onClick={save} disabled={isPending}>
          {t('common.save')}
        </BaseButton>
      </div>
    </BaseModal>
  );
}
