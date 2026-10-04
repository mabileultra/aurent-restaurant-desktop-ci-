import { useState } from 'react';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { lineHasPendingSend } from '../utils/floorPosDerivations';
import CancelReceiptPreview from './CancelReceiptPreview';
import RstConfirmDialog from './RstConfirmDialog';
import '../styles/order-workspace.css';
import '../styles/item-compose-modal.css';

function isKitchenLocked(status) {
  return status && status !== 'NEW' && status !== 'CANCELLED';
}

function pendingQty(line) {
  if (line?.itemStatus === 'NEW') return Number(line.quantity) || 0;
  const qty = Number(line?.quantity) || 0;
  const sent = line?.sentQuantity == null ? qty : (Number(line.sentQuantity) || 0);
  return Math.max(0, qty - sent);
}

function categoryTone(name) {
  const s = String(name || '').trim().toLowerCase();
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return (h % 8) + 1;
}

export default function OrderLines({
  items,
  onQty,
  onRemove,
  onEditNote,
  locked = false,
  allowKitchenRefuse = false,
  categoryByMenuId = null,
  /** `detail` = price×qty=sum; `total` = only line sum (cashier). */
  priceMode = 'detail',
  t,
}) {
  const [pendingRefuse, setPendingRefuse] = useState(null);

  if (!items.length) {
    return <div className="rst-order-empty">{t('rst.order.emptyLines')}</div>;
  }

  const askKitchenRefuse = (line, run, refuseQty) => {
    const qty = Math.max(1, Number(refuseQty) || Number(line?.quantity) || 1);
    const unit = Number(line?.unitPrice) || 0;
    setPendingRefuse({
      line: {
        ...line,
        quantity: qty,
        lineTotal: unit * qty,
      },
      run,
    });
  };

  const runQty = (line, nextQty, kitchen) => {
    if (kitchen && nextQty < Number(line.quantity)) {
      const cut = Number(line.quantity) - Number(nextQty);
      askKitchenRefuse(line, () => onQty?.(line, nextQty), cut);
      return;
    }
    onQty?.(line, nextQty);
  };

  const runRemove = (line, kitchen) => {
    if (kitchen) {
      askKitchenRefuse(line, () => onRemove?.(line), line.quantity);
      return;
    }
    onRemove?.(line);
  };

  return (
    <>
      <div className="rst-order-lines">
        {items.map((line) => {
          const kitchen = isKitchenLocked(line.itemStatus);
          const isNew = line.itemStatus === 'NEW';
          const pending = lineHasPendingSend(line);
          const reorderPending = kitchen && pending;
          const canEditNew = !locked && isNew;
          const canEditKitchen = allowKitchenRefuse && kitchen;
          const canEditPending = !locked && reorderPending;
          const canEdit = canEditNew || canEditKitchen || canEditPending;
          const category = categoryByMenuId?.[line.menuItemId]
            || categoryByMenuId?.[String(line.menuItemId)]
            || '';
          const tone = categoryTone(category);
          const minQty = kitchen && !allowKitchenRefuse
            ? (line.sentQuantity == null ? Number(line.quantity) || 0 : Number(line.sentQuantity) || 0)
            : 0;
          return (
            <div
              key={line.id}
              className={`rst-order-line${isNew || reorderPending ? ' is-new' : ''}${kitchen ? ' is-kitchen' : ''}${canEditKitchen || canEditPending ? ' is-open' : ''}${tone ? ` is-cat-${tone}` : ''}`}
              title={category || undefined}
            >
              <div className="rst-order-line__main">
                <div className={`rst-order-line__title${priceMode === 'total' ? ' rst-order-line__title--total' : ''}`}>
                  <strong>{line.name}</strong>
                  {isNew ? <span className="rst-order-line__pill rst-order-line__pill--new">{t('rst.order.badgeNew')}</span> : null}
                  {reorderPending ? (
                    <span className="rst-order-line__pill rst-order-line__pill--new">
                      {t('rst.order.badgeReorder', { defaultValue: `+${pendingQty(line)}`, count: pendingQty(line) })}
                    </span>
                  ) : null}
                  {kitchen ? <span className="rst-order-line__pill rst-order-line__pill--kitchen">{t('rst.order.onKitchen')}</span> : null}
                  {priceMode === 'total' ? (
                    <span className="rst-order-line__sum">{fmtMoneyCompact(line.lineTotal)}</span>
                  ) : null}
                </div>
                {priceMode === 'detail' ? (
                  <div className="rst-order-line__meta">
                    {fmtMoneyCompact(line.unitPrice)} × {line.quantity} = {fmtMoneyCompact(line.lineTotal)}
                  </div>
                ) : null}
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
                {canEdit ? (
                  <>
                    {canEditNew && onEditNote ? (
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
                        disabled={minQty > 0 && Number(line.quantity) <= minQty}
                        onClick={() => runQty(line, Number(line.quantity) - 1, canEditKitchen)}
                      >
                        −
                      </button>
                      <span className="rst-qty-stepper__value">{Number(line.quantity)}</span>
                      <button
                        type="button"
                        className="rst-qty"
                        aria-label="+"
                        onClick={() => onQty?.(line, Number(line.quantity) + 1)}
                      >
                        +
                      </button>
                    </div>
                    {canEditNew || canEditKitchen ? (
                      <button
                        type="button"
                        className="rst-order-line__remove"
                        aria-label={t('common.delete')}
                        title={canEditKitchen
                          ? t('rst.order.refuseKitchenItem', { defaultValue: 'Отказ позиции' })
                          : undefined}
                        onClick={() => runRemove(line, canEditKitchen)}
                      >
                        ✕
                      </button>
                    ) : null}
                  </>
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

      <RstConfirmDialog
        open={!!pendingRefuse}
        title={t('rst.order.refuseKitchenItem', { defaultValue: 'Отказ позиции' })}
        size="md"
        confirmLabel={t('common.confirm', { defaultValue: 'Подтвердить' })}
        cancelLabel={t('common.cancel')}
        danger
        onClose={() => setPendingRefuse(null)}
        onConfirm={() => pendingRefuse?.run?.()}
      >
        <CancelReceiptPreview
          lines={pendingRefuse?.line ? [pendingRefuse.line] : []}
          hint={t('rst.order.confirmRefuseKitchenItem', {
            name: pendingRefuse?.line?.name || '',
            defaultValue: `Вы действительно хотите отменить «${pendingRefuse?.line?.name || ''}»?`,
          })}
          t={t}
        />
      </RstConfirmDialog>
    </>
  );
}
