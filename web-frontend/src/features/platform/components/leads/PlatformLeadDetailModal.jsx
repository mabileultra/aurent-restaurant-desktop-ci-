import { BaseButton, BaseModal } from '../../../../components/ui';
import PlatformSelect from '../PlatformSelect';

function DetailRow({ label, value }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900 dark:text-white">{value || '—'}</dd>
    </div>
  );
}

export default function PlatformLeadDetailModal({
  open,
  lead,
  t,
  editStatus,
  onStatusChange,
  editNote,
  onNoteChange,
  onClose,
  onSave,
  isSaving,
}) {
  if (!lead) return null;

  return (
    <BaseModal
      open={open}
      title={t('platform.leads.detailTitle')}
      onClose={onClose}
      size="lg"
      footer={(
        <>
          <BaseButton variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton variant="primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </BaseButton>
        </>
      )}
    >
      <dl className="space-y-4">
        <DetailRow label={t('platform.leads.colName')} value={lead.name} />
        <DetailRow label={t('platform.leads.colPhone')} value={lead.phone} />
        <DetailRow label={t('platform.leads.colEmail')} value={lead.email} />
        <DetailRow label={t('platform.leads.colType')} value={t(`platform.leads.types.${lead.leadType}`)} />
        <DetailRow
          label={t('platform.leads.colSource')}
          value={t(`platform.leads.sources.${lead.source}`, lead.source)}
        />
        <DetailRow label={t('platform.leads.preferredTime')} value={lead.preferredTime} />
        <DetailRow label={t('platform.leads.message')} value={lead.message} />
        <DetailRow label={t('platform.leads.locale')} value={lead.locale} />
      </dl>

      <div className="mt-6 space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
        <div>
          <label htmlFor="lead-status" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('common.status')}
          </label>
          <PlatformSelect
            id="lead-status"
            size="md"
            value={editStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            options={['NEW', 'IN_PROGRESS', 'DONE', 'REJECTED'].map((s) => ({
              value: s,
              label: t(`platform.leads.statuses.${s}`),
            }))}
            searchable={false}
          />
        </div>
        <div>
          <label htmlFor="lead-note" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('platform.leads.managerNote')}
          </label>
          <textarea
            id="lead-note"
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={editNote}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={t('platform.leads.managerNotePh')}
          />
        </div>
      </div>
    </BaseModal>
  );
}
