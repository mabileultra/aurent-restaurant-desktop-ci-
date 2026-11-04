import { Eye, Mail, Send } from 'lucide-react';
import PlatformEmailRecipientsList from './PlatformEmailRecipientsList';

export default function PlatformEmailBroadcastForm({
  t,
  subject,
  onSubjectChange,
  message,
  onMessageChange,
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
  onPreview,
  onSend,
  previewPending,
  sendPending,
}) {
  return (
    <section className="platform-email-card">
      <div className="platform-email-card__head">
        <span className="platform-email-card__icon" aria-hidden>
          <Send size={16} />
        </span>
        <h2 className="platform-email-card__title">{t('platform.email.broadcastTitle')}</h2>
      </div>
      <div className="platform-email-card__body">
        <div className="platform-email-field">
          <label htmlFor="email-subject">{t('platform.email.subject')}</label>
          <input
            id="email-subject"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder={t('platform.email.subjectPlaceholder')}
          />
        </div>

        <div className="platform-email-field">
          <label htmlFor="email-message">{t('platform.email.message')}</label>
          <textarea
            id="email-message"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={t('platform.email.messagePlaceholder')}
          />
        </div>

        <PlatformEmailRecipientsList
          t={t}
          selectAllActive={selectAllActive}
          onSelectAllActive={onSelectAllActive}
          userSearch={userSearch}
          onUserSearchChange={onUserSearchChange}
          filteredUsers={filteredUsers}
          usersLoading={usersLoading}
          allVisibleSelected={allVisibleSelected}
          onSelectAllVisible={onSelectAllVisible}
          selectedIds={selectedIds}
          onToggleUser={onToggleUser}
        />

        <div className="platform-email-actions">
          <button
            type="button"
            className="admin-btn-secondary platform-email-btn"
            onClick={onPreview}
            disabled={previewPending}
          >
            <Eye size={15} />
            {t('platform.email.preview')}
          </button>
          <button
            type="button"
            className="admin-btn-primary platform-email-btn"
            onClick={onSend}
            disabled={sendPending}
          >
            <Mail size={15} />
            {t('platform.email.send')}
          </button>
        </div>
      </div>
    </section>
  );
}
