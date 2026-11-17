import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

export default function UserDeleteConfirmModal({ user, t, isPending, onClose, onConfirm }) {
  if (!user) return null;

  const modalNode = (
    <div className="ui-modal-overlay z-[1000]">
      <div className="ui-modal-panel max-w-md">
        <div className="ui-modal-header">
          <h2 className="text-base font-semibold text-ink">{t('users.deleteTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="ui-icon-btn"
            aria-label={t('common.close')}
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="ui-modal-body text-sm text-ink">
          {t('users.deleteHint', { name: user.fullName })}
        </div>
        <div className="ui-modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="ui-btn-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="ui-btn-danger-solid"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalNode, document.body);
  }
  return modalNode;
}
