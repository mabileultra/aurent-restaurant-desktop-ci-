import { useState } from 'react';
import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { formatElapsed } from '../utils/formatElapsed';
import RstOverlay from '../../shared/components/RstOverlay';
import RstConfirmDialog from './RstConfirmDialog';
import '../../shared/styles/rst-modal.css';
import '../styles/floor-phase2.css';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function OccupiedTableModal({
  open,
  table,
  order,
  orderLoading,
  waiterName,
  waiterNameById,
  now,
  onClose,
  onContinue,
  onTransfer,
  onMerge,
  onAssignWaiter,
  onCancel,
  canCancel,
  canTransferMerge,
  canAssignWaiter,
  checks = [],
  selectedOrderId,
  onSelectOrder,
  onNewCheck,
  canOpenOrder,
  t,
}) {
  const [cancelAsk, setCancelAsk] = useState(false);
  if (!open || !table) return null;
  const summary = table.activeOrder;
  const linked = summary?.linkedTableCodes?.length
    ? ` + ${summary.linkedTableCodes.join(' + ')}`
    : '';
  const items = order?.items ?? [];
  const history = order?.waiterHistory ?? [];

  return (
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card rst-modal__card--wide">
        <h2 className="rst-modal__title">
          {t('rst.floor.tableTitle', { code: table.code })}{linked}
        </h2>

        {checks.length > 1 ? (
          <div className="rst-occupied-modal__checks">
            {checks.map((check) => (
              <button
                key={check.id}
                type="button"
                className={`rst-occupied-modal__check${check.id === selectedOrderId ? ' is-active' : ''}`}
                onClick={() => onSelectOrder?.(check.id)}
              >
                <span>{t('rst.floor.checkNo', { no: check.orderNo })}</span>
                <strong>{fmtMoneyCompact(check.subtotal || 0)}</strong>
              </button>
            ))}
          </div>
        ) : null}

        {orderLoading && !order ? (
          <p className="rst-modal__text">{t('common.loading')}</p>
        ) : (
          <>
            <dl className="rst-occupied-modal__meta">
              <div>
                <dt>{t('rst.order.waiter')}</dt>
                <dd>{waiterName || t('rst.floor.waiterNone')}</dd>
              </div>
              <div>
                <dt>{t('rst.order.guestCount')}</dt>
                <dd>{summary?.guestCount ?? order?.guestCount ?? '—'}</dd>
              </div>
              <div>
                <dt>{t('rst.floor.openedAt')}</dt>
                <dd>
                  {formatTime(summary?.openedAt || order?.openedAt)}
                  {summary?.openedAt ? ` · ${formatElapsed(summary.openedAt, now)}` : ''}
                </dd>
              </div>
              <div>
                <dt>{t('rst.floor.amount')}</dt>
                <dd>{fmtMoneyCompact(summary?.subtotal ?? order?.subtotal ?? 0)}</dd>
              </div>
            </dl>

            {items.length ? (
              <ul className="rst-occupied-modal__lines">
                {items.map((line) => (
                  <li key={line.id}>
                    <span>{line.name}</span>
                    <strong>× {line.quantity}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rst-modal__text">{t('rst.floor.noLinesYet')}</p>
            )}

            {history.length > 0 ? (
              <ul className="rst-occupied-modal__history">
                {history.map((row) => (
                  <li key={`${row.waiterUserId}-${row.assignedAt}`}>
                    <span>{formatTime(row.assignedAt)}</span>
                    <span>
                      {waiterNameById?.get(String(row.waiterUserId)) || t('rst.floor.waiterUnknown')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="rst-occupied-modal__actions">
              <BaseButton type="button" onClick={onContinue}>
                {t('rst.floor.continueOrder')}
              </BaseButton>
              {canOpenOrder ? (
                <BaseButton type="button" variant="ghost" onClick={onNewCheck}>
                  {t('rst.order.newCheck')}
                </BaseButton>
              ) : null}
              {canAssignWaiter ? (
                <BaseButton type="button" variant="ghost" onClick={onAssignWaiter}>
                  {t('rst.floor.assignWaiter')}
                </BaseButton>
              ) : null}
              {canTransferMerge ? (
                <>
                  <BaseButton type="button" variant="ghost" onClick={onTransfer}>
                    {t('rst.floor.transferTable')}
                  </BaseButton>
                  <BaseButton type="button" variant="ghost" onClick={onMerge}>
                    {t('rst.floor.mergeTables')}
                  </BaseButton>
                </>
              ) : null}
              {canCancel ? (
                <BaseButton type="button" variant="ghost" onClick={() => setCancelAsk(true)}>
                  {t('rst.floor.closeOrder')}
                </BaseButton>
              ) : null}
              <BaseButton type="button" variant="ghost" onClick={onClose}>
                {t('common.close')}
              </BaseButton>
            </div>
          </>
        )}
      </div>
      <RstConfirmDialog
        open={cancelAsk}
        title={t('rst.floor.closeOrder')}
        message={t('rst.order.confirmCancel')}
        confirmLabel={t('common.confirm', { defaultValue: 'Подтвердить' })}
        cancelLabel={t('common.cancel')}
        danger
        onClose={() => setCancelAsk(false)}
        onConfirm={() => onCancel?.()}
      />
    </RstOverlay>
  );
}
