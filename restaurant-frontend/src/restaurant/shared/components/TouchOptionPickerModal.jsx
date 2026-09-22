import RstModal from './RstModal';
import { BaseButton } from '../../../components/ui';
import '../styles/touch-pickers.css';

/** Large-tap option list for POS / touch monitors. */
export default function TouchOptionPickerModal({
  open,
  title,
  options = [],
  value,
  onSelect,
  onClose,
  t,
}) {
  if (!open) return null;

  return (
    <RstModal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={(
        <BaseButton type="button" variant="ghost" onClick={onClose}>
          {t('common.close')}
        </BaseButton>
      )}
    >
      <div className="rst-touch-options" role="listbox" aria-label={title}>
        {options.map((option) => {
          const active = String(option.value) === String(value);
          return (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={active}
              className={`rst-touch-options__item${active ? ' is-active' : ''}`}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </RstModal>
  );
}
