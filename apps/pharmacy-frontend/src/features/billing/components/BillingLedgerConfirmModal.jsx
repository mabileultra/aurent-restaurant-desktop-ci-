import { Loader } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../components/ui';

export default function BillingLedgerConfirmModal({
  open,
  onClose,
  title,
  hint,
  note,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending = false,
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      className="billing-confirm-modal"
      footer={(
        <div className="flex gap-2">
          <BaseButton variant="secondary" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </BaseButton>
          <BaseButton variant="danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader size={14} className="animate-spin" /> : null}
            {confirmLabel}
          </BaseButton>
        </div>
      )}
    >
      <p className="text-sm text-ink">{hint}</p>
      {note ? <p className="mt-2 text-xs text-ink-muted">{note}</p> : null}
    </BaseModal>
  );
}
