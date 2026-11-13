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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-aa-lg border border-aa-line bg-aa-surface p-5 shadow-aa-modal">
        <h2 className="text-lg font-bold text-aa-ink">{t('users.credentialsCreatedTitle')}</h2>
        <p className="mt-2 text-sm text-aa-ink-muted">{t('users.credentialsCreatedHint')}</p>
        <div className="mt-4 space-y-2 rounded-aa-md bg-aa-surface-sunken border border-aa-line p-3 text-sm text-aa-ink">
          {credentials.companyLoginCode ? (
            <p>
              <span className="text-aa-ink-muted">{t('users.platformCompanyCode')}:</span>{' '}
              <span className="font-mono font-semibold text-aa-ink">{credentials.companyLoginCode}</span>
            </p>
          ) : null}
          <p>
            <span className="text-aa-ink-muted">{t('users.credentialsLogin')}:</span>{' '}
            <span className="font-mono font-semibold text-aa-ink">{credentials.username}</span>
          </p>
          {credentials.role === 'CASHIER' || credentials.role === 'WAITER' || credentials.role === 'COOK' ? (
            <p>
              <span className="text-aa-ink-muted">{t('users.pin')}:</span>{' '}
              <span className="font-mono font-semibold text-aa-ink">{credentials.pin}</span>
            </p>
          ) : (
            <p>
              <span className="text-aa-ink-muted">{t('users.password')}:</span>{' '}
              <span className="font-mono font-semibold text-aa-ink">{credentials.password}</span>
            </p>
          )}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="aa-btn aa-btn--secondary aa-size-md inline-flex flex-1 items-center justify-center gap-2 cursor-pointer"
            onClick={copyCredentials}
          >
            <Copy size={16} />
            {t('users.copyAll')}
          </button>
          <button
            type="button"
            className="aa-btn aa-btn--primary aa-size-md inline-flex flex-1 items-center justify-center cursor-pointer"
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
