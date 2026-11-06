import CashierBottomNav from '../../../../components/layout/cashier/bottom-nav/CashierBottomNav';
import { usePayFlowTransition } from '../../hooks/usePayFlowTransition';
import CashierPayColumn from '../register-pay-rail/CashierPayColumn';

/**
 * Единый каркас кассы: stage + правая оплата + нижнее меню.
 * Слева (children) — свой контент: товары/чек, аптека, ресторан…
 *
 * @param {object} pay — props для PayColumn + onPayFlowClosed
 * @param {import('react').ComponentType} [PayColumn] — колонка оплаты (аптека может подменить)
 */
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
          <CashierBottomNav className="cashier-register__bottom-nav" />
        </div>
      </div>
    </div>
  );
}
