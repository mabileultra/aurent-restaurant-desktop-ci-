/** Футер шага оплаты — тот же шаблон, что у PosRegisterPayFooter (Продажа + чек). */
export default function PosPayFlowFooter({ primary, printToggle }) {
  if (primary && printToggle) {
    return (
      <div className="pos-register-pay-footer">
        {primary}
        {printToggle}
      </div>
    );
  }

  if (primary) {
    return <div className="pos-register-pay-footer">{primary}</div>;
  }

  if (printToggle) {
    return (
      <div className="pos-register-pay-footer pos-register-pay-footer--toggle-only">{printToggle}</div>
    );
  }

  return null;
}
