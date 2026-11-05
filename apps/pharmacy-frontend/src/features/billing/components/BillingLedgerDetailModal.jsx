import { Hash, Tag, User, Wallet } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../components/ui';

export default function BillingLedgerDetailModal({
  open,
  onClose,
  row,
  t,
  money,
  formatDateTime,
  onDelete,
  deleting = false,
}) {
  if (!row) return null;

  const plus = Number(row.amount) >= 0;
  const typeLabel = t(`billing.ledgerTypes.${row.entryType}`, { defaultValue: row.entryType });
  const actorLabel = row.actorRole
    ? t(`billing.actors.${row.actorRole}`, { defaultValue: row.actorRole })
    : '—';

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('billing.ledgerDetailTitle')}
      size="md"
      className="billing-detail-modal"
      footer={(
        <div className="flex gap-2">
          <BaseButton variant="secondary" onClick={onClose} disabled={deleting}>
            {t('common.close')}
          </BaseButton>
          <BaseButton variant="danger" onClick={() => onDelete(row)} disabled={deleting}>
            {t('billing.deleteOne')}
          </BaseButton>
        </div>
      )}
    >
      <div className="billing-detail">
        <div className={`billing-detail__amount ${plus ? 'billing-amount--plus' : 'billing-amount--minus'}`}>
          {plus ? '+' : ''}{money(row.amount)} {t('billing.currency')}
        </div>
        <p className="billing-detail__date">{formatDateTime(row.createdAt)}</p>

        <dl className="billing-detail__grid">
          <div>
            <dt><Tag size={14} /> {t('billing.colType')}</dt>
            <dd>
              <span className={`billing-badge billing-badge--${row.entryType}`}>
                {typeLabel}
              </span>
            </dd>
          </div>
          <div>
            <dt><Wallet size={14} /> {t('billing.ledgerBalanceAfter')}</dt>
            <dd>{money(row.balanceAfter)} {t('billing.currency')}</dd>
          </div>
          <div>
            <dt><User size={14} /> {t('billing.ledgerActor')}</dt>
            <dd>{actorLabel}</dd>
          </div>
          <div>
            <dt><Hash size={14} /> {t('billing.ledgerId')}</dt>
            <dd className="billing-detail__mono">{row.id}</dd>
          </div>
        </dl>

        <div className="billing-detail__desc">
          <p className="billing-detail__label">{t('billing.colDesc')}</p>
          <p>{row.description || '—'}</p>
        </div>
      </div>
    </BaseModal>
  );
}
