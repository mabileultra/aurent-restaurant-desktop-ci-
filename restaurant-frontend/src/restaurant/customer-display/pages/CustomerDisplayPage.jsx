import { useTranslation } from 'react-i18next';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { CFD_PHASE } from '../customerDisplayChannel';
import { useCustomerDisplayFeed } from '../useCustomerDisplayFeed';
import CustomerDisplayIdle from '../components/CustomerDisplayIdle';
import CustomerDisplayPaying from '../components/CustomerDisplayPaying';
import CustomerDisplayThanks from '../components/CustomerDisplayThanks';
import CustomerDisplayTicket from '../components/CustomerDisplayTicket';
import '../styles/customer-display.css';

export default function CustomerDisplayPage() {
  const { t } = useTranslation();
  const { hasModule } = useModuleAccess();
  const snapshot = useCustomerDisplayFeed();
  const allowed = hasModule('restaurantCustomerDisplay');

  if (!allowed) {
    return (
      <div className="rst-cfd">
        <p className="rst-cfd__denied">{t('rst.cfd.denied')}</p>
      </div>
    );
  }

  const phase = snapshot.phase || CFD_PHASE.IDLE;
  const shellClass = [
    'rst-cfd',
    phase === CFD_PHASE.PAYING ? 'rst-cfd--paying' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass}>
      <header className="rst-cfd__header">
        <div className="rst-cfd__logo" aria-hidden>A</div>
        <p className="rst-cfd__brand">{t('rst.cfd.brand')}</p>
      </header>
      <main className="rst-cfd__body">
        {phase === CFD_PHASE.PAYING ? <CustomerDisplayPaying t={t} /> : null}
        {phase === CFD_PHASE.THANKS ? <CustomerDisplayThanks t={t} /> : null}
        {phase === CFD_PHASE.ACTIVE ? <CustomerDisplayTicket snapshot={snapshot} t={t} /> : null}
        {phase === CFD_PHASE.IDLE ? <CustomerDisplayIdle t={t} /> : null}
      </main>
    </div>
  );
}
