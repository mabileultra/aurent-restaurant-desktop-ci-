import RstOverlay from '../../shared/components/RstOverlay';
import { BaseButton } from '../../../components/ui';

/** Edit note on an existing NEW order line. */
export default function LineNoteModal({
  open,
  line,
  value,
  onChange,
  onClose,
  onSave,
  isPending = false,
  t,
}) {
  if (!open || !line) return null;

  return (
    <RstOverlay onClose={onClose} className="rst-line-note-modal">
      <div className="rst-modal__card rst-line-note">
        <h2 className="rst-modal__title">{t('rst.order.lineNoteTitle', { name: line.name })}</h2>
        <label className="rst-item-compose__note">
          <span>{t('rst.order.lineNote')}</span>
          <textarea
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            maxLength={300}
            placeholder={t('rst.order.lineNotePh')}
          />
        </label>
        <div className="rst-modal__actions">
          <BaseButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" onClick={onSave} disabled={isPending}>
            {t('common.save')}
          </BaseButton>
        </div>
      </div>
    </RstOverlay>
  );
}
