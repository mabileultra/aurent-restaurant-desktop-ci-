import { BaseButton, BaseInput } from '../../../components/ui';
import '../../shared/styles/rst-modal.css';

export default function ShiftModal({
  mode,
  openingCash,
  closingCash,
  onOpeningCash,
  onClosingCash,
  onClose,
  onSubmit,
  isPending,
  t,
}) {
  if (!mode) return null;
  const isOpen = mode === 'open';

  return (
    <div className="rst-modal" role="dialog" aria-modal="true">
      <div className="rst-modal__card">
        <h2 className="rst-modal__title">
          {isOpen ? t('rst.shift.openTitle') : t('rst.shift.closeTitle')}
        </h2>
        <p className="rst-modal__text">
          {isOpen ? t('rst.shift.openHint') : t('rst.shift.closeHint')}
        </p>
        <label className="d-block mb-3">
          <span className="small d-block mb-1">
            {isOpen ? t('rst.shift.openingCash') : t('rst.shift.closingCash')}
          </span>
          <BaseInput
            type="number"
            min="0"
            step="0.01"
            value={isOpen ? openingCash : closingCash}
            onChange={(e) => (isOpen ? onOpeningCash(e.target.value) : onClosingCash(e.target.value))}
          />
        </label>
        <div className="rst-modal__actions">
          <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
          <BaseButton type="button" onClick={onSubmit} disabled={isPending}>
            {isOpen ? t('rst.shift.open') : t('rst.shift.close')}
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
