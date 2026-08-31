import { BaseButton } from '../../../components/ui';
import { usePublicLeadForm } from '../hooks/usePublicLeadForm';
import '../../../styles/public-site/public-lead-form.css';

export default function PublicLeadForm({
  leadType = 'QUESTION',
  source = 'contacts',
  compact = false,
}) {
  const { t, form, updateField, submit, isSubmitting } = usePublicLeadForm({ leadType, source });

  return (
    <form className={`public-lead-form${compact ? ' public-lead-form--compact' : ''}`} onSubmit={submit}>
      <div className="public-lead-form__grid">
        <label className="public-lead-form__field">
          <span>{t('publicSite.leadForm.name')}</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={t('publicSite.leadForm.namePh')}
            required
            autoComplete="name"
          />
        </label>
        <label className="public-lead-form__field">
          <span>{t('publicSite.leadForm.phone')}</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder={t('publicSite.leadForm.phonePh')}
            required
            autoComplete="tel"
          />
        </label>
        <label className="public-lead-form__field">
          <span>{t('publicSite.leadForm.email')}</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder={t('publicSite.leadForm.emailPh')}
            autoComplete="email"
          />
        </label>
        <label className="public-lead-form__field">
          <span>{t('publicSite.leadForm.preferredTime')}</span>
          <input
            type="text"
            value={form.preferredTime}
            onChange={(e) => updateField('preferredTime', e.target.value)}
            placeholder={t('publicSite.leadForm.preferredTimePh')}
          />
        </label>
      </div>
      <label className="public-lead-form__field public-lead-form__field--full">
        <span>{t('publicSite.leadForm.message')}</span>
        <textarea
          rows={compact ? 3 : 4}
          value={form.message}
          onChange={(e) => updateField('message', e.target.value)}
          placeholder={t('publicSite.leadForm.messagePh')}
        />
      </label>
      <BaseButton type="submit" variant="primary" disabled={isSubmitting} className="public-lead-form__submit">
        {isSubmitting ? t('publicSite.leadForm.sending') : t('publicSite.leadForm.submit')}
      </BaseButton>
    </form>
  );
}
