import { FileText, Hash, Pencil, Tag } from 'lucide-react';
import FinanceDetailFieldGrid, { FinanceDetailFieldCard } from '../detail/FinanceDetailFieldGrid';
import FinanceDetailHero from '../detail/FinanceDetailHero';
import FinanceDetailModalShell from '../detail/FinanceDetailModalShell';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function FinanceAuditDetailModal({ open, onClose, record, t }) {
  const summaryPreview = record?.summary?.slice(0, 80) ?? '—';

  return (
    <FinanceDetailModalShell
      open={open}
      onClose={onClose}
      title={t('finance.detail.auditTitle')}
      wide={Boolean(record?.details)}
    >
      {record ? (
        <>
          <FinanceDetailHero
            amountLabel={t('finance.audit.action')}
            amount={t(`finance.audit.actions.${record.action}`, { defaultValue: record.action })}
            amountTone="neutral"
            date={formatDateTime(record.createdAt)}
          />

          <FinanceDetailFieldGrid>
            <FinanceDetailFieldCard
              label={t('finance.audit.entityType')}
              value={t(`finance.audit.types.${record.entityType}`, { defaultValue: record.entityType })}
              icon={Tag}
            />
            <FinanceDetailFieldCard
              label={t('finance.detail.entityId')}
              value={record.entityId}
              icon={Hash}
              mono
            />
            <FinanceDetailFieldCard
              label={t('finance.detail.recordId')}
              value={record.id}
              icon={Hash}
              mono
            />
            {record.actorId ? (
              <FinanceDetailFieldCard
                label={t('finance.detail.actorId')}
                value={record.actorId}
                icon={Pencil}
                mono
              />
            ) : null}
          </FinanceDetailFieldGrid>

          {record.summary ? (
            <div className="finance-detail-modal__section">
              <h3 className="finance-detail-modal__section-title">{t('finance.audit.summary')}</h3>
              <p className="finance-detail-modal__comment">{record.summary}</p>
            </div>
          ) : (
            <p className="finance-detail-modal__hint">{summaryPreview}</p>
          )}

          {record.details ? (
            <div className="finance-detail-modal__section">
              <h3 className="finance-detail-modal__section-title">{t('finance.detail.fullDetails')}</h3>
              <p className="finance-detail-modal__comment">{record.details}</p>
            </div>
          ) : null}
        </>
      ) : null}
    </FinanceDetailModalShell>
  );
}
