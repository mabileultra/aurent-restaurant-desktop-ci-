import PosPaymentFlow from '../../cashier/components/PosPaymentFlow';
import PharmacyPayStack from './PharmacyPayStack';

/**
 * Колонка оплаты аптеки — tall-stack слева (ТЗ §3).
 */
export default function PharmacyPayColumn({
  payOpen = false,
  total,
  onReturn,
  onDiscount,
  onHold,
  onPreviewCheck,
  onParkedList,
  onCashIn,
  onCashOut,
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
          <PharmacyPayStack
            total={total}
            onReturn={onReturn}
            onDiscount={onDiscount}
            onHold={onHold}
            onPreviewCheck={onPreviewCheck}
            onParkedList={onParkedList}
            onCashIn={onCashIn}
            onCashOut={onCashOut}
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
