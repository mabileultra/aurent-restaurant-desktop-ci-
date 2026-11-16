import { usePayFlowTransition } from '../../hooks/usePayFlowTransition';
import CashierPayColumn from '../register-pay-rail/CashierPayColumn';

export default function CashierRegisterShell({
  splitClassName = '',
  stageClassName = '',
  beforeWorkspace = null,
  pay,
  PayColumn = CashierPayColumn,
  children,
}) {
  const { onPayFlowClosed, ...payColumnProps } = pay;
  usePayFlowTransition(payColumnProps.payOpen, onPayFlowClosed);

  const splitClass = [
    'cashier-register__split',
    'cashier-register__split--pane',
    splitClassName,
  ].filter(Boolean).join(' ');

  const stageClass = [
    'cashier-register__stage',
    stageClassName,
  ].filter(Boolean).join(' ');

  return (
    <div className={splitClass}>
      {beforeWorkspace}
      <div className="cashier-register__workspace">
        <div className={stageClass}>
          {children}
          <PayColumn {...payColumnProps} />
        </div>
      </div>
    </div>
  );
}
