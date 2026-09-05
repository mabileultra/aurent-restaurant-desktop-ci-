import PosPaymentFlow from '../../cashier/components/PosPaymentFlow';
import PharmacyPayRail from './PharmacyPayRail';

/**
 * Правая колонка оплаты аптеки — отдельный rail, retail CashierPayColumn не меняем.
 */
export default function PharmacyPayColumn({
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
  payFlowKeyPrefix = 'pharmacy-pay-flow',
  cartCustomer = null,
  className = '',
}) {
  const asideClass = [
    'cashier-register__actions-col',
    payOpen ? 'cashier-register__actions-col--pay' : '',
    'pharmacy-pay-column',
    className,
  ].filter(Boolean).join(' ');

  return (
    <aside className={asideClass}>
      <div className="cashier-register__pay-shell">
        <div
          className="cashier-register__pay-pane cashier-register__pay-pane--rail"
          inert={payOpen || undefined}
        >
          <PharmacyPayRail
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
              cartCustomer={cartCustomer}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
