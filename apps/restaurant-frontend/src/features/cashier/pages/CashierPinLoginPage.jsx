import { useEffect, useSyncExternalStore } from 'react';
import { ArrowLeft } from 'lucide-react';
import CashierPinLoginCompanyPopover from '../components/pin-login/CashierPinLoginCompanyPopover';
import CashierPinLoginChrome from '../components/pin-login/CashierPinLoginChrome';
import CashierPinLoginRoster from '../components/pin-login/CashierPinLoginRoster';
import CashierPinLoginKeypad from '../components/pin-login/CashierPinLoginKeypad';
import CashierPinLoginAdminForm from '../components/pin-login/CashierPinLoginAdminForm';
import CashierPinLoginVisual from '../components/pin-login/CashierPinLoginVisual';
import { useCashierPinLoginPage } from '../hooks/useCashierPinLoginPage';
import { pinRoleLabel, staffInitial } from '../utils/pinRosterRoles';
import {
  readRestaurantTheme,
  subscribeRestaurantTheme,
  syncRestaurantTheme,
} from '../../../store/themeStore';
import '../../../styles/cashier/pin-login.css';
import '../../../styles/cashier/pin-login-roster.css';

export default function CashierPinLoginPage() {
  const theme = useSyncExternalStore(subscribeRestaurantTheme, readRestaurantTheme, () => 'dark');
  const {
    t,
    touchLayout,
    step,
    roster,
    rosterLoading,
    rosterError,
    selectedStaff,
    selectStaff,
    openAdminLogin,
    backToRoster,
    reloadRoster,
    dots,
    dotCount,
    pinError,
    pinFull,
    loading,
    canSubmit,
    adminUsername,
    setAdminUsername,
    adminPassword,
    setAdminPassword,
    adminError,
    showAdminPass,
    toggleAdminPass,
    submitAdmin,
    companyCode,
    setCompanyCode,
    companyPopoverOpen,
    setCompanyPopoverOpen,
    showCompanyCodeField,
    pressDigit,
    backspace,
    clear,
    submit,
    toggleFullscreen,
    quitApp,
    showQuit,
  } = useCashierPinLoginPage();

  useEffect(() => {
    syncRestaurantTheme(theme);
  }, [theme]);

  const pinSubtitle = selectedStaff
    ? t('cashierLogin.pinFor', {
      name: selectedStaff.displayName,
      defaultValue: 'PIN — {{name}}',
    })
    : t('cashierLogin.subtitle', { defaultValue: 'Введите PIN-код' });

  return (
    <div
      className={[
        'cashier-pin-login',
        'cashier-pin-login--roster',
        theme === 'light' ? 'cashier-pin-login--roster-light' : '',
        touchLayout ? 'cashier-pin-login--touch' : '',
      ].filter(Boolean).join(' ')}
    >
      <CashierPinLoginVisual />

      <div className="cashier-pin-roster">
        <CashierPinLoginChrome
          t={t}
          onFullscreen={toggleFullscreen}
          onQuit={quitApp}
          showQuit={showQuit}
          companyControl={showCompanyCodeField ? (
            <CashierPinLoginCompanyPopover
              t={t}
              value={companyCode}
              onChange={setCompanyCode}
              disabled={loading}
              open={companyPopoverOpen}
              onToggle={() => setCompanyPopoverOpen((v) => !v)}
              onClose={() => setCompanyPopoverOpen(false)}
            />
          ) : null}
        />
        {step === 'roster' ? (
          <CashierPinLoginRoster
            t={t}
            roster={roster}
            loading={rosterLoading}
            error={rosterError}
            onSelect={selectStaff}
            onRetry={reloadRoster}
            onAdmin={openAdminLogin}
          />
        ) : null}

        {step === 'admin' ? (
          <CashierPinLoginAdminForm
            t={t}
            username={adminUsername}
            password={adminPassword}
            error={adminError}
            loading={loading}
            showPass={showAdminPass}
            onUsername={setAdminUsername}
            onPassword={setAdminPassword}
            onTogglePass={toggleAdminPass}
            onSubmit={submitAdmin}
            onBack={backToRoster}
          />
        ) : null}

        {step === 'pin' ? (
          <div className="cashier-pin-roster__pin-step">
            <div className="cashier-pin-roster__pin-card">
              <button
                type="button"
                className="cashier-pin-roster__back"
                onClick={backToRoster}
                disabled={loading}
              >
                <ArrowLeft size={20} strokeWidth={2.2} />
                {t('common.back', { defaultValue: 'Назад' })}
              </button>

              {selectedStaff ? (
                <div className="cashier-pin-roster__pin-user">
                  <span className="cashier-pin-roster__avatar" aria-hidden="true">
                    {staffInitial(selectedStaff.displayName)}
                  </span>
                  <div>
                    <p className="cashier-pin-roster__pin-name">{selectedStaff.displayName}</p>
                    <p className="cashier-pin-roster__pin-role">
                      {pinRoleLabel(selectedStaff.role, t)}
                    </p>
                  </div>
                </div>
              ) : null}

              <p className="cashier-pin-roster__pin-hint">{pinSubtitle}</p>

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
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
