import RstModal from '../../shared/components/RstModal';
import { BaseButton } from '../../../components/ui';

function formatWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Read-only reservation card; open-order is an explicit action. */
export default function ReservedTableModal({
  open,
  table,
  onClose,
  onOpenOrder,
  canOpenOrder,
  t,
}) {
  if (!open || !table) return null;
  const r = table.reservation;

  return (
    <RstModal
      open={open}
      title={t('rst.floor.reservationTitle')}
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <BaseButton type="button" variant="ghost" onClick={onClose}>
            {t('common.close')}
          </BaseButton>
          {canOpenOrder ? (
            <BaseButton type="button" onClick={onOpenOrder}>
              {t('rst.floor.seatAndOpen')}
            </BaseButton>
          ) : null}
        </>
      )}
    >
      <dl className="rst-occupied-modal__meta">
        <div>
          <dt>{t('rst.floor.tableTitle', { code: table.code })}</dt>
          <dd>{t('rst.status.RESERVED')}</dd>
        </div>
        <div>
          <dt>{t('rst.booking.clientName')}</dt>
          <dd>{r?.clientName || '—'}</dd>
        </div>
        <div>
          <dt>{t('rst.booking.clientPhone')}</dt>
          <dd>{r?.clientPhone || '—'}</dd>
        </div>
        <div>
          <dt>{t('rst.booking.reservedAt')}</dt>
          <dd>{formatWhen(r?.reservedAt)}</dd>
        </div>
        <div>
          <dt>{t('rst.booking.guestCount')}</dt>
          <dd>{r?.guestCount ?? table.seatCount ?? '—'}</dd>
        </div>
        <div className="rst-modal-form__full">
          <dt>{t('rst.booking.notes')}</dt>
          <dd>{r?.notes || '—'}</dd>
        </div>
      </dl>
      <p className="rst-modal__text">{t('rst.floor.reservationGuardHint')}</p>
    </RstModal>
  );
}
