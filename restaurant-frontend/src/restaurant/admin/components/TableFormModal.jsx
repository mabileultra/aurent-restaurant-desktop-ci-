import { BaseInput } from '../../../components/ui';
import { MANUAL_TABLE_STATUSES } from '../../pos/utils/tableStatus';
import RstModal from '../../shared/components/RstModal';

export default function TableFormModal({ open, mode, form, onChange, onClose, onSubmit, isPending, t }) {
  return (
    <RstModal
      open={open}
      title={mode === 'edit' ? t('rst.admin.editTable') : t('rst.admin.addTable')}
      onClose={onClose}
      onSubmit={onSubmit}
      isPending={isPending}
      asForm
      cancelLabel={t('common.cancel')}
      submitLabel={t('common.save')}
      size="md"
    >
      <div className="rst-modal-form__grid">
        <BaseInput
          label={t('rst.admin.tableCode')}
          required
          value={form.code}
          onChange={(e) => onChange({ ...form, code: e.target.value })}
        />
        <BaseInput
          label={t('rst.admin.tableLabel')}
          value={form.label}
          onChange={(e) => onChange({ ...form, label: e.target.value })}
        />
        <BaseInput
          label={t('rst.admin.seatCount')}
          type="number"
          min={1}
          required
          value={form.seatCount}
          onChange={(e) => onChange({ ...form, seatCount: e.target.value })}
        />
        <div className="base-field">
          <label className="base-field__label" htmlFor="rst-table-status">
            {t('rst.admin.status')}
          </label>
          <select
            id="rst-table-status"
            className="base-field__control"
            value={form.status}
            onChange={(e) => onChange({ ...form, status: e.target.value })}
          >
            {MANUAL_TABLE_STATUSES.map((status) => (
              <option key={status} value={status}>{t(`rst.status.${status}`)}</option>
            ))}
          </select>
        </div>
        <div className="rst-modal-form__full">
          <BaseInput
            label={t('rst.admin.servicePercent')}
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={form.servicePercent ?? ''}
            onChange={(e) => onChange({ ...form, servicePercent: e.target.value })}
          />
          <p className="rst-modal-form__hint">{t('rst.admin.servicePercentTableHint')}</p>
        </div>
      </div>
    </RstModal>
  );
}
