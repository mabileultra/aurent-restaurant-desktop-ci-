import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import CashierPinLoginVisual from '../components/pin-login/CashierPinLoginVisual';
import CashierPinLoginHeader from '../components/pin-login/CashierPinLoginHeader';
import CashierPinLoginCompanyPopover from '../components/pin-login/CashierPinLoginCompanyPopover';
import CashierPinLoginKeypad from '../components/pin-login/CashierPinLoginKeypad';
import { useCashierPinLoginPage } from '../hooks/useCashierPinLoginPage';
import '../../../styles/cashier/pin-login.css';

export default function CashierPinLoginPage() {
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const {
    t,
    touchLayout,
    dots,
    dotCount,
    pinError,
    pinFull,
    loading,
    canSubmit,
    companyCode,
    setCompanyCode,
    companyPopoverOpen,
    setCompanyPopoverOpen,
    showCompanyCodeField,
    pressDigit,
    backspace,
    clear,
    submit,
  } = useCashierPinLoginPage();

  const subtitle = t('cashierLogin.subtitle', { defaultValue: 'Введите PIN-код' });

  return (
    <div className={`cashier-pin-login${touchLayout ? ' cashier-pin-login--touch' : ''}`}>
      {showCompanyCodeField ? (
        <div className="cashier-pin-login__top-actions">
          <CashierPinLoginCompanyPopover
            t={t}
            value={companyCode}
            onChange={setCompanyCode}
            disabled={loading}
            open={companyPopoverOpen}
            onToggle={() => setCompanyPopoverOpen((v) => !v)}
            onClose={() => setCompanyPopoverOpen(false)}
          />
        </div>
      ) : null}

      <div className="cashier-pin-login__layout">
        <CashierPinLoginVisual />

        <section className="cashier-pin-login__panel" aria-label={subtitle}>
          <div className="cashier-pin-login__shell">
            <CashierPinLoginHeader appName={displayAppName()} subtitle={subtitle} />

            <CashierPinLoginKeypad
              t={t}
              dots={dots}
              dotCount={dotCount}
              pinError={pinError}
              pinFull={pinFull}
              loading={loading}
              canSubmit={canSubmit}
              onDigit={pressDigit}
              onBackspace={backspace}
              onClear={clear}
              onSubmit={submit}
            />

            <footer className="cashier-pin-login__footer">
              <p className="cashier-pin-login__copyright">
                {t('login.footer', { year: new Date().getFullYear() })}
              </p>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
