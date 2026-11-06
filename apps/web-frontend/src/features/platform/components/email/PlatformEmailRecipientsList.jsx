import { Search, Users } from 'lucide-react';
import { userDisplayName, userMetaLine } from '../../utils/emailUtils';

export default function PlatformEmailRecipientsList({
  t,
  selectAllActive,
  onSelectAllActive,
  userSearch,
  onUserSearchChange,
  filteredUsers,
  usersLoading,
  allVisibleSelected,
  onSelectAllVisible,
  selectedIds,
  onToggleUser,
}) {
  return (
    <div className="platform-email-recipients">
      <label className={`platform-email-toggle${selectAllActive ? ' is-active' : ''}`}>
        <input
          type="checkbox"
          checked={selectAllActive}
          onChange={(e) => onSelectAllActive(e.target.checked)}
        />
        <span className="platform-email-toggle__icon" aria-hidden>
          <Users size={15} />
        </span>
        <span className="platform-email-toggle__text">
          <span className="platform-email-toggle__title">{t('platform.email.selectAll')}</span>
          <span className="platform-email-toggle__hint">{t('platform.email.selectAllHint')}</span>
        </span>
      </label>

      {!selectAllActive ? (
        <>
          <div className="platform-email-recipients__bar">
            <label className="platform-email-recipients__search" htmlFor="email-user-search">
              <Search size={14} aria-hidden />
              <input
                id="email-user-search"
                value={userSearch}
                onChange={(e) => onUserSearchChange(e.target.value)}
                placeholder={t('platform.email.recipientSearch')}
              />
            </label>
            <label className="platform-email-select-all">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(e) => onSelectAllVisible(e.target.checked)}
              />
              {t('platform.email.selectAllVisible', { count: filteredUsers.length })}
            </label>
          </div>
          <div className="platform-email-users">
            {usersLoading ? (
              <p className="platform-email-hint">{t('common.loading')}</p>
            ) : filteredUsers.length === 0 ? (
              <p className="platform-email-empty">{t('platform.email.noUsers')}</p>
            ) : (
              filteredUsers.map((user) => (
                <label
                  key={user.id}
                  className={`platform-email-user-row${selectedIds.has(user.id) ? ' is-selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(user.id)}
                    onChange={() => onToggleUser(user.id)}
                  />
                  <span className="platform-email-user-row__text">
                    <span className="platform-email-user-row__name">{userDisplayName(user)}</span>
                    <span className="platform-email-user-row__meta">{userMetaLine(user, t)}</span>
                  </span>
                </label>
              ))
            )}
          </div>
          {selectedIds.size > 0 ? (
            <p className="platform-email-hint">{t('platform.email.selectedCount', { count: selectedIds.size })}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
