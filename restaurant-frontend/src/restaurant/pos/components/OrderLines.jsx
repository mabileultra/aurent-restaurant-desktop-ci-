import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/order-workspace.css';
import '../styles/item-compose-modal.css';

function isKitchenLocked(status) {
  return status && status !== 'NEW' && status !== 'CANCELLED';
}

export default function OrderLines({
  items,
  onQty,
  onRemove,
  onEditNote,
  locked = false,
  allowKitchenRefuse = false,
  t,
}) {
  if (!items.length) {
    return <div className="rst-order-empty">{t('rst.order.emptyLines')}</div>;
  }

  return (
    <div className="rst-order-lines">
      {items.map((line) => {
        const kitchen = isKitchenLocked(line.itemStatus);
        const isNew = line.itemStatus === 'NEW';
        const canEditNew = !locked && isNew;
        const canRefuseKitchen = allowKitchenRefuse && kitchen;
        return (
          <div
            key={line.id}
            className={`rst-order-line${isNew ? ' is-new' : ''}${kitchen ? ' is-kitchen' : ''}${canRefuseKitchen ? ' is-open' : ''}`}
          >
            <div className="rst-order-line__main">
              <div className="rst-order-line__title">
                <strong>{line.name}</strong>
                {isNew ? <span className="rst-order-line__pill rst-order-line__pill--new">{t('rst.order.badgeNew')}</span> : null}
                {kitchen ? <span className="rst-order-line__pill rst-order-line__pill--kitchen">{t('rst.order.onKitchen')}</span> : null}
              </div>
              <div className="rst-order-line__meta">
                {fmtMoneyCompact(line.unitPrice)} × {line.quantity} = {fmtMoneyCompact(line.lineTotal)}
              </div>
              {(line.modifiers ?? []).length ? (
                <div className="rst-order-line__mods">
                  {(line.modifiers ?? []).map((mod) => (
                    <span key={mod.id || mod.name}>+ {mod.name}</span>
                  ))}
                </div>
              ) : null}
              {line.note ? (
                <div className="rst-order-line__note">«{line.note}»</div>
              ) : null}
            </div>

            <div className="rst-order-line__actions">
              {canEditNew ? (
                <>
                  {onEditNote ? (
                    <button
                      type="button"
                      className="rst-order-line__note-btn"
                      title={t('rst.order.lineNote')}
                      onClick={() => onEditNote(line)}
                    >
                      ✎
                    </button>
                  ) : null}
                  <div className="rst-qty-stepper">
                    <button
                      type="button"
                      className="rst-qty"
                      aria-label="-"
                      onClick={() => onQty(line, Number(line.quantity) - 1)}
                    >
                      −
                    </button>
                    <span className="rst-qty-stepper__value">{Number(line.quantity)}</span>
                    <button
                      type="button"
                      className="rst-qty"
                      aria-label="+"
                      onClick={() => onQty(line, Number(line.quantity) + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="rst-order-line__remove"
                    aria-label={t('common.delete')}
                    onClick={() => onRemove(line.id)}
                  >
                    ✕
                  </button>
                </>
              ) : canRefuseKitchen ? (
                <button
                  type="button"
                  className="rst-order-line__refuse"
                  title={t('rst.order.refuseKitchenItem', { defaultValue: 'Отказ (на принтер кухни)' })}
                  onClick={() => {
                    if (window.confirm(t('rst.order.confirmRefuseKitchenItem', {
                      name: line.name,
                      defaultValue: `Отказать «${line.name}» и отправить на принтер кухни?`,
                    }))) {
                      onRemove(line.id);
                    }
                  }}
                >
                  {t('rst.order.refuseShort', { defaultValue: 'Отказ' })}
                </button>
              ) : kitchen ? (
                <span className="rst-order-line__lock" title={t('rst.order.onKitchen')} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
