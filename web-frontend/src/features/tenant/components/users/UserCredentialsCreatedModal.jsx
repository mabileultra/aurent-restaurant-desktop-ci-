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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('users.credentialsCreatedTitle')}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('users.credentialsCreatedHint')}</p>
        <div className="admin-soft-panel mt-4 space-y-2 p-3 text-sm">
          {credentials.companyLoginCode ? (
            <p>
              <span className="text-slate-500">{t('users.platformCompanyCode')}:</span>{' '}
              <span className="font-mono font-semibold">{credentials.companyLoginCode}</span>
            </p>
          ) : null}
          <p>
            <span className="text-slate-500">{t('users.credentialsLogin')}:</span>{' '}
            <span className="font-mono font-semibold">{credentials.username}</span>
          </p>
          {credentials.role === 'CASHIER' || credentials.role === 'WAITER' || credentials.role === 'COOK' ? (
            <p>
              <span className="text-slate-500">{t('users.pin')}:</span>{' '}
              <span className="font-mono font-semibold">{credentials.pin}</span>
            </p>
          ) : (
            <p>
              <span className="text-slate-500">{t('users.password')}:</span>{' '}
              <span className="font-mono font-semibold">{credentials.password}</span>
            </p>
          )}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5"
            onClick={copyCredentials}
          >
            <Copy size={16} />
            {t('users.copyAll')}
          </button>
          <button
            type="button"
            className="admin-btn-primary flex-1 py-2.5 text-sm"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
