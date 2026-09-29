import { BaseInput } from '../../../components/ui';
import RstModal from '../../shared/components/RstModal';

export default function HallFormModal({ open, mode, form, onChange, onClose, onSubmit, isPending, t }) {
  return (
    <RstModal
      open={open}
      title={mode === 'edit' ? t('rst.admin.editHall') : t('rst.admin.addHall')}
      onClose={onClose}
      onSubmit={onSubmit}
      isPending={isPending}
      asForm
      cancelLabel={t('common.cancel')}
      submitLabel={t('common.save')}
      size="sm"
    >
      <div className="rst-modal-form__grid rst-modal-form__grid--1">
        <BaseInput
          label={t('rst.admin.hallName')}
          required
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
        <BaseInput
          label={t('rst.admin.sortOrder')}
          type="number"
          min={0}
          required
          value={form.sortOrder}
          onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
        />
        <div>
          <BaseInput
            label={t('rst.admin.servicePercent')}
            type="number"
            min={0}
            max={100}
            step="0.01"
            required
            value={form.servicePercent ?? 0}
            onChange={(e) => onChange({ ...form, servicePercent: e.target.value })}
          />
          <p className="rst-modal-form__hint">{t('rst.admin.servicePercentHallHint')}</p>
        </div>
      </div>
    </RstModal>
  );
}
