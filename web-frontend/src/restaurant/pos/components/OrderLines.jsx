import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/order-workspace.css';

export default function OrderLines({ items, onQty, onRemove, locked = false, t }) {
  if (!items.length) {
    return <div className="rst-order-empty">{t('rst.order.emptyLines')}</div>;
  }

  return (
    <div className="rst-order-lines">
      {items.map((line) => {
        const lineLocked = locked || line.itemStatus !== 'NEW';
        return (
          <div key={line.id} className="rst-order-line">
            <div>
              <strong>{line.name}</strong>
              <div className="rst-order-line__meta">
                {fmtMoneyCompact(line.unitPrice)} × {line.quantity}
                {' · '}
                {t(`rst.order.itemStatus.${line.itemStatus}`)}
                {line.itemStatus === 'SENT_TO_KITCHEN' || line.itemStatus === 'ACCEPTED' || line.itemStatus === 'PREPARING' || line.itemStatus === 'READY' ? (
                  <span className="rst-order-line__kitchen">{t('rst.order.onKitchen')}</span>
                ) : null}
                {(line.modifiers ?? []).length
                  ? ` · ${(line.modifiers ?? []).map((mod) => mod.name).join(', ')}`
                  : ''}
              </div>
            </div>
            <div className="rst-order-line__actions">
              {lineLocked ? null : (
                <>
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
                  <BaseButton type="button" variant="ghost" size="sm" onClick={() => onRemove(line.id)}>
                    {t('common.delete')}
                  </BaseButton>
                </>
              )}
            </div>
            <strong className="rst-order-line__total">{fmtMoneyCompact(line.lineTotal)}</strong>
          </div>
        );
      })}
    </div>
  );
}
