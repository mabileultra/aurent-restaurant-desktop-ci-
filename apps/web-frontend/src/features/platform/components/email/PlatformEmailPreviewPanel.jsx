import { Eye } from 'lucide-react';
import { BaseSelect } from '../../../../components/ui';
import { templateLabel } from '../../utils/emailUtils';

export default function PlatformEmailPreviewPanel({
  t,
  previewSubject,
  templateType,
  templates,
  templatesError,
  activeTemplate,
  onTemplateChange,
  previewHtml,
  previewPending,
}) {
  return (
    <section className="platform-email-card">
      <div className="platform-email-card__head">
        <span className="platform-email-card__icon" aria-hidden>
          <Eye size={16} />
        </span>
        <h2 className="platform-email-card__title">{t('platform.email.previewTitle')}</h2>
        {previewSubject ? (
          <span className="platform-email-card__meta">{previewSubject}</span>
        ) : null}
      </div>
      <div className="platform-email-card__body">
        <div className="platform-email-field">
          {templatesError ? (
            <p className="platform-email-error">{t('platform.email.templatesLoadFailed')}</p>
          ) : null}
          <BaseSelect
            id="email-template-type"
            label={t('platform.email.templateType')}
            value={templateType}
            disabled={!templates.length}
            onChange={(e) => onTemplateChange(e.target.value)}
            placeholder={t('common.loading')}
            options={
              templates.length === 0
                ? [{ value: '', label: t('common.loading') }]
                : templates.map((tpl) => ({
                    value: tpl.type,
                    label: templateLabel(t, tpl),
                  }))
            }
          />
        </div>

        {activeTemplate ? (
          <div className="platform-email-template">
            <div className="platform-email-template__title">{templateLabel(t, activeTemplate)}</div>
            <div className="platform-email-template__desc">{activeTemplate.description}</div>
            <div className="platform-email-template__vars">
              {activeTemplate.variables?.map((v) => (
                <span key={v} className="platform-email-template__var">{`{{${v}}}`}</span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="platform-email-preview">
          {previewHtml ? (
            <iframe title={t('platform.email.previewTitle')} srcDoc={previewHtml} />
          ) : (
            <p className="platform-email-preview__empty">
              {previewPending ? t('common.loading') : t('platform.email.previewEmpty')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
