import { useMemo } from 'react';
import { ChefHat, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import PosOrderPanel from '../../cashier/components/PosOrderPanel';
import { groupUnsentKitchenLines, sessionToCartItems } from '../utils/sessionCartItems';

export default function RestaurantOrderPanel({
  session,
  loading,
  payableTotal,
  orderDiscount,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onUpdateQuantity,
  onRemove,
  onSendToKitchen,
  sendToKitchenPending,
  sendingDepartment,
  kitchenDepartments,
  onClose,
  t,
}) {
  const { t: tDefault } = useTranslation();
  const tr = t ?? tDefault;

  const lines = session?.lines ?? [];
  const items = useMemo(() => (session ? sessionToCartItems(session) : []), [session]);
  const { groups: unsentByDept, total: unsentTotal } = useMemo(
    () => groupUnsentKitchenLines(lines),
    [lines],
  );

  const departmentLabel = useMemo(() => {
    const map = new Map((kitchenDepartments ?? []).map((dep) => [dep.value, dep.label]));
    map.set('GENERAL', tr('restaurantCashier.kitchenGeneral'));
    map.set('NONE', tr('restaurantCashier.kitchenNone'));
    return (value) => map.get(value) ?? value;
  }, [kitchenDepartments, tr]);

  const unsentDepartments = useMemo(
    () => [...unsentByDept.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    [unsentByDept],
  );

  if (!session) {
    return (
      <div className="restaurant-order-panel restaurant-order-panel--loading">
        <p className="restaurant-order-panel__loading">{tr('common.loading')}</p>
      </div>
    );
  }

  const title = tr('restaurantCashier.tableOrder', { code: session.tableCode });
  const subtitle = [
    tr('restaurantCashier.guests', { count: session.guestCount }),
    session.waiterName,
  ].filter(Boolean).join(' · ');

  return (
    <div className="restaurant-order-panel">
      <div className="restaurant-order-panel__toolbar">
        <div className="restaurant-order-panel__toolbar-main">
          <h2 className="restaurant-order-panel__toolbar-title">{title}</h2>
          {subtitle ? <p className="restaurant-order-panel__toolbar-meta">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          className="restaurant-order-panel__close"
          onClick={onClose}
          aria-label={tr('common.close')}
        >
          <X size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <PosOrderPanel
        className="restaurant-order-panel__check"
        hideHeader
        items={items}
        total={payableTotal ?? session.subtotal}
        taxTotal={0}
        priceEditable={false}
        showTotalsFoot={items.length > 0}
        selectedLineId={selectedLineId}
        onSelectLine={onSelectLine}
        onQtyDelta={onQtyDelta}
        onUpdateQuantity={onUpdateQuantity}
        onUpdatePrice={() => {}}
        onRemove={onRemove}
        resolveDepartmentLabel={departmentLabel}
      />

      {orderDiscount > 0 ? (
        <p className="restaurant-order-panel__discount">
          {tr('restaurantCashier.orderDiscount', { amount: fmt(orderDiscount) })}
        </p>
      ) : null}

      {loading ? (
        <p className="restaurant-order-panel__loading">{tr('common.loading')}</p>
      ) : null}

      <footer className="restaurant-order-panel__kitchen">
        {unsentTotal > 0 ? (
          <button
            type="button"
            className="restaurant-order-panel__kitchen-btn restaurant-order-panel__kitchen-btn--all"
            disabled={sendToKitchenPending}
            onClick={() => onSendToKitchen()}
          >
            <ChefHat size={18} strokeWidth={2.25} aria-hidden />
            <span>{tr('restaurantCashier.sendAllToKitchen', { count: unsentTotal })}</span>
          </button>
        ) : null}

        <div className="restaurant-order-panel__kitchen-deps">
          {unsentDepartments.map(([department, count]) => (
            <button
              key={department}
              type="button"
              className="restaurant-order-panel__kitchen-dep"
              disabled={sendToKitchenPending}
              onClick={() => onSendToKitchen(department)}
            >
              <span className="restaurant-order-panel__kitchen-dep-label">
                {departmentLabel(department)}
              </span>
              <span className="restaurant-order-panel__kitchen-dep-count">{count}</span>
              {sendToKitchenPending && sendingDepartment === department ? (
                <span className="restaurant-order-panel__kitchen-dep-pending">{tr('common.loading')}</span>
              ) : (
                <span className="restaurant-order-panel__kitchen-dep-action">
                  {tr('restaurantCashier.sendDeptToKitchen')}
                </span>
              )}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
