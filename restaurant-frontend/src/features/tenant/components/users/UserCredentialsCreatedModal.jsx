import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { BaseButton, BaseModal } from '../../../../components/ui';
import '../../../../restaurant/shared/styles/rst-modal.css';
import './user-form-modal.css';

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
    <BaseModal
      open
      onClose={onClose}
      title={t('users.credentialsCreatedTitle')}
      size="md"
      className="base-modal--rst"
      overlayClassName="base-modal-overlay--rst"
      footer={(
        <>
          <BaseButton type="button" variant="ghost" onClick={copyCredentials}>
            <Copy size={16} />
            {t('users.copyAll')}
          </BaseButton>
          <BaseButton type="button" onClick={onClose}>
            {t('common.close')}
          </BaseButton>
        </>
      )}
    >
      <p className="user-form-modal__hint">{t('users.credentialsCreatedHint')}</p>
      <div className="user-form-modal__cred-panel">
        {credentials.companyLoginCode ? (
          <p>
            <span className="user-form-modal__muted">{t('users.platformCompanyCode')}:</span>{' '}
            <span className="user-form-modal__mono">{credentials.companyLoginCode}</span>
          </p>
        ) : null}
        <p>
          <span className="user-form-modal__muted">{t('users.credentialsLogin')}:</span>{' '}
          <span className="user-form-modal__mono">{credentials.username}</span>
        </p>
        {credentials.role === 'CASHIER' || credentials.role === 'WAITER' || credentials.role === 'COOK' ? (
          <p>
            <span className="user-form-modal__muted">{t('users.pin')}:</span>{' '}
            <span className="user-form-modal__mono">{credentials.pin}</span>
          </p>
        ) : (
          <p>
            <span className="user-form-modal__muted">{t('users.password')}:</span>{' '}
            <span className="user-form-modal__mono">{credentials.password}</span>
          </p>
        )}
      </div>
    </BaseModal>
  );
}
