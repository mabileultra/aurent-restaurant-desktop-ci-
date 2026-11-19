import { createPortal } from 'react-dom';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

function buildCredentialsText(cred, t) {
  const lines = [];
  if (cred.companyLoginCode) {
    lines.push(`${t('users.platformCompanyCode')}: ${cred.companyLoginCode}`);
  }
  lines.push(`${t('users.credentialsLogin')}: ${cred.username}`);
  if ((cred.role === 'CASHIER' || cred.role === 'WAITER' || cred.role === 'COOK') && cred.pin) {
    lines.push(`${t('users.pin')}: ${cred.pin}`);
  } else if (cred.password) {
    lines.push(`${t('users.password')}: ${cred.password}`);
  }
  return lines.join('\n');
}

export default function UserCredentialsCreatedModal({ credentials, t, onClose }) {
  if (!credentials) return null;

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(buildCredentialsText(credentials, t));
      toast.success(t('users.copied'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const modalNode = (
    <div className="ui-modal-overlay z-[1000]">
      <div className="ui-modal-panel max-w-md p-6">
        <h2 className="text-lg font-semibold text-ink">{t('users.credentialsCreatedTitle')}</h2>
        <p className="mt-2 text-sm text-ink-muted">{t('users.credentialsCreatedHint')}</p>
        <div className="mt-4 space-y-2 rounded-card border border-line bg-canvas p-3.5 text-sm">
          {credentials.companyLoginCode ? (
            <p>
              <span className="text-ink-muted">{t('users.platformCompanyCode')}:</span>{' '}
              <span className="font-mono font-semibold ui-tabular text-ink">{credentials.companyLoginCode}</span>
            </p>
          ) : null}
          <p>
            <span className="text-ink-muted">{t('users.credentialsLogin')}:</span>{' '}
            <span className="font-mono font-semibold text-ink">{credentials.username}</span>
          </p>
          {credentials.role === 'CASHIER' || credentials.role === 'WAITER' || credentials.role === 'COOK' ? (
            <p>
              <span className="text-ink-muted">{t('users.pin')}:</span>{' '}
              <span className="font-mono font-semibold ui-tabular text-ink">{credentials.pin}</span>
            </p>
          ) : (
            <p>
              <span className="text-ink-muted">{t('users.password')}:</span>{' '}
              <span className="font-mono font-semibold text-ink">{credentials.password}</span>
            </p>
          )}
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="ui-btn-secondary flex-1"
            onClick={copyCredentials}
          >
            <Copy size={16} />
            {t('users.copyAll')}
          </button>
          <button
            type="button"
            className="ui-btn-primary flex-1"
            onClick={onClose}
          >
            {t('common.close')}
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
