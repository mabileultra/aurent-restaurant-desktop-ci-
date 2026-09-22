import RestaurantAslSettingsPanel from '../components/RestaurantAslSettingsPanel';
import RestaurantTaxSettingsPanel from '../components/RestaurantTaxSettingsPanel';
import { useIntegrationsAdminPage } from '../hooks/useIntegrationsAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/integrations-admin.css';

export default function IntegrationsAdminPage() {
  const p = useIntegrationsAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-integrations">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.integrations.title')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.integrations.subtitle')}</p>
        </div>
      </div>

      {!p.workspace.storeId ? (
        <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>
      ) : (
        <div className="rst-integrations__grid">
          {p.aslSupported ? (
            <RestaurantAslSettingsPanel
              storeId={p.workspace.storeId}
              storeName={p.store?.name || p.workspace.storeName}
              t={p.t}
            />
          ) : (
            <div className="rst-notice">{p.t('rst.integrations.aslUnsupported')}</div>
          )}

          <RestaurantTaxSettingsPanel
            cashRegisterId={p.cashRegisterId}
            registers={p.registers}
            registersLoading={p.registersLoading}
            onSelectRegister={p.setCashRegisterId}
            t={p.t}
          />
        </div>
      )}
    </section>
  );
}
