import { Shield, UserPlus } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';

export default function PlatformSuperAdminsSection({ t, adminsLoading, superAdmins, onAdd, onEdit }) {
  return (
    <section className="platform-security__card">
      <div className="platform-security__card-head">
        <span className="platform-security__icon" aria-hidden>
          <Shield size={16} />
        </span>
        <div className="platform-security__titles">
          <h2 className="platform-security__title">{t('platform.security.superAdminsTitle')}</h2>
          <p className="platform-security__hint">{t('platform.security.superAdminsHint')}</p>
        </div>
        <BaseButton variant="secondary" onClick={onAdd}>
          <UserPlus size={16} />
          {t('platform.security.addSuperAdmin')}
        </BaseButton>
      </div>

      <div className="platform-security__table">
        <table className="w-full text-sm">
          <thead>
            <tr className="platform-security__head">
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3">{t('platform.security.colName')}</th>
              <th className="px-4 py-3">{t('platform.security.colLogin')}</th>
              <th className="px-4 py-3">{t('platform.security.colEmail')}</th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
            <tbody>
            {adminsLoading ? (
              <tr>
                <td colSpan={6} className="platform-security__empty">{t('common.loading')}</td>
              </tr>
            ) : superAdmins.length === 0 ? (
              <tr>
                <td colSpan={6} className="platform-security__empty">{t('platform.security.emptyAdmins')}</td>
              </tr>
            ) : (
              superAdmins.map((row, index) => (
                <tr key={row.id}>
                  <AdminTableNoIdCells
                    page={0}
                    pageSize={superAdmins.length || 1}
                    index={index}
                    id={row.id}
                  />
                  <td className="platform-security__name">{row.fullName}</td>
                  <td className="platform-security__muted">{row.username}</td>
                  <td className="platform-security__muted">{row.email}</td>
                  <td className="platform-security__actions-cell">
                    <button type="button" className="platform-security__edit" onClick={() => onEdit(row)}>
                      {t('common.edit')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
