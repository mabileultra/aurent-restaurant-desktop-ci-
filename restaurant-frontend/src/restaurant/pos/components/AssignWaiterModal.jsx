import { BaseButton } from '../../../components/ui';
import RstOverlay from '../../shared/components/RstOverlay';
import '../../shared/styles/rst-modal.css';

export default function AssignWaiterModal({
  open,
  currentWaiterId,
  currentWaiterName,
  waiters,
  selectedId,
  onSelect,
  onClose,
  onConfirm,
  isPending,
  t,
}) {
  if (!open) return null;

  return (
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card">
        <h2 className="rst-modal__title">{t('rst.floor.assignWaiterTitle')}</h2>
        <p className="rst-modal__text">
          {t('rst.floor.assignWaiterCurrent')}: <strong>{currentWaiterName || t('rst.floor.waiterNone')}</strong>
        </p>
        <label className="d-block mb-3">
          <span className="d-block mb-1 small">{t('rst.floor.assignWaiterNew')}</span>
          <select
            className="form-select"
            value={selectedId || ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="">{t('rst.order.pickWaiter')}</option>
            {waiters.map((waiter) => (
              <option key={waiter.id} value={waiter.id} disabled={String(waiter.id) === String(currentWaiterId)}>
                {waiter.name}
              </option>
            ))}
          </select>
        </label>
        <div className="rst-modal__actions">
          <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
          <BaseButton type="button" disabled={!selectedId || isPending} onClick={onConfirm}>
            {t('rst.floor.assignWaiterConfirm')}
          </BaseButton>
        </div>
      </div>
    </RstOverlay>
  );
}
