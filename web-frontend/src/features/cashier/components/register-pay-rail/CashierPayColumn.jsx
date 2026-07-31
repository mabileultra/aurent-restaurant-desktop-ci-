import PosRegisterPayRail from '../register-pay-rail/PosRegisterPayRail';
import PosPaymentFlow from '../PosPaymentFlow';

/**
 * Единая правая колонка оплаты для всех касс (retail / pharmacy / restaurant).
 * Разметка и стили — cashier-register__actions-col + pay-shell из общего layout.
 */
export default function CashierPayColumn({
  payOpen = false,
  total,
  onReturn,
  onDiscount,
  onConfirm,
  onOpenPaymentFlow,
  onClosePayment,
  checkoutDisabled = false,
  isPending = false,
  payFlowOptions = null,
  payFlowSession = 0,
  payFlowKeyPrefix = 'pay-flow',
  className = '',
}) {
  const asideClass = [
    'cashier-register__actions-col',
    payOpen ? 'cashier-register__actions-col--pay' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <aside className={asideClass}>
      <div className="cashier-register__pay-shell">
        <div
          className="cashier-register__pay-pane cashier-register__pay-pane--rail"
          inert={payOpen || undefined}
        >
          <PosRegisterPayRail
            total={total}
            onReturn={onReturn}
            onDiscount={onDiscount}
            onConfirm={onConfirm}
            onOpenPaymentFlow={onOpenPaymentFlow}
            checkoutDisabled={checkoutDisabled}
            isPending={isPending}
          />
        </div>

        {payOpen ? (
          <div className="cashier-register__pay-pane cashier-register__pay-pane--flow">
            <PosPaymentFlow
              key={`${payFlowKeyPrefix}-${payFlowSession}`}
              onClose={onClosePayment}
              total={total}
              isPending={isPending}
              onConfirm={onConfirm}
              openOptions={payFlowOptions}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
