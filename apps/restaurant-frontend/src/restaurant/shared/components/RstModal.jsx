import { BaseButton, BaseModal } from '../../../components/ui';
import '../styles/rst-modal.css';

/**
 * Restaurant-themed modal shell — reuse for all rst admin/POS dialogs.
 */
export default function RstModal({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  submitLabel,
  cancelLabel,
  onSubmit,
  isPending = false,
  submitDisabled = false,
  asForm = false,
}) {
  const resolvedFooter = footer ?? (
    (onClose || onSubmit) ? (
      <>
        {onClose ? (
          <BaseButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </BaseButton>
        ) : null}
        {onSubmit ? (
          <BaseButton type={asForm ? 'submit' : 'button'} form={asForm ? 'rst-modal-form' : undefined} disabled={isPending || submitDisabled} onClick={asForm ? undefined : onSubmit}>
            {submitLabel}
          </BaseButton>
        ) : null}
      </>
    ) : null
  );

  const body = asForm ? (
    <form
      id="rst-modal-form"
      className="rst-modal-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      {children}
    </form>
  ) : children;

  return (
    <BaseModal
      open={open}
      title={title}
      onClose={onClose}
      size={size}
      className="base-modal--rst"
      overlayClassName="base-modal-overlay--rst"
      footer={resolvedFooter}
    >
      {body}
    </BaseModal>
  );
}
