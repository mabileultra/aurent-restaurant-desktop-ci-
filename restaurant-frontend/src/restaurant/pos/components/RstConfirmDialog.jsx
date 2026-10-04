import { BaseButton } from '../../../components/ui';
import RstModal from '../../shared/components/RstModal';

/** In-app confirm — window.confirm is unreliable on POS tablets / WebViews. */
export default function RstConfirmDialog({
  open,
  title,
  message,
  children = null,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  danger = false,
  size = 'sm',
}) {
  if (!open) return null;
  return (
    <RstModal
      open={open}
      title={title}
      onClose={onClose}
      size={size}
      footer={(
        <>
          <BaseButton type="button" variant="ghost" onClick={onClose}>
            {cancelLabel}
          </BaseButton>
          <BaseButton
            type="button"
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            {confirmLabel}
          </BaseButton>
        </>
      )}
    >
      {children || (
        <p className="rst-modal__text" style={{ margin: 0 }}>{message}</p>
      )}
    </RstModal>
  );
}
