import RstModal from '../../shared/components/RstModal';
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
    <RstModal
      open={open}
      title={t('rst.order.lineNoteTitle', { name: line.name })}
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <BaseButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" onClick={onSave} disabled={isPending}>
            {t('common.save')}
          </BaseButton>
        </>
      )}
    >
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
    </RstModal>
  );
}
