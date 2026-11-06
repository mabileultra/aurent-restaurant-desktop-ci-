import { BaseModal } from '../../../../components/ui';
import { useUserFormModal } from '../../hooks/useUserFormModal';
import UserCredentialsCreatedModal from './UserCredentialsCreatedModal';
import UserFormModalFields from './UserFormModalFields';
import '../../../../restaurant/shared/styles/rst-modal.css';
import './user-form-modal.css';

export default function UserFormModal(props) {
  const p = useUserFormModal(props);

  if (!p.open && !p.createdCredentials) return null;

  return (
    <>
      <UserCredentialsCreatedModal
        credentials={p.createdCredentials}
        t={p.t}
        onClose={p.dismissCredentials}
      />
      <BaseModal
        open={p.open}
        onClose={p.onClose}
        title={p.isEdit ? p.t('users.editUser') : p.t('users.newUser')}
        size="lg"
        className="base-modal--rst"
        overlayClassName="base-modal-overlay--rst"
      >
        {p.isEdit && !p.user?.id ? (
          <p className="user-form-modal__loading">{p.t('common.loading')}</p>
        ) : (
          <UserFormModalFields {...p} />
        )}
      </BaseModal>
    </>
  );
}
