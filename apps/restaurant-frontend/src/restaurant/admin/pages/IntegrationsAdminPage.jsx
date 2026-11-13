import AdminWorkspaceGate from '../components/AdminWorkspaceGate';
import RestaurantTaxSettingsPanel from '../components/RestaurantTaxSettingsPanel';
import { useIntegrationsAdminPage } from '../hooks/useIntegrationsAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/integrations-admin.css';

export default function IntegrationsAdminPage() {
  const p = useIntegrationsAdminPage();

  return (
    <AdminWorkspaceGate
      t={p.t}
      workspace={p.workspace}
      isLoading={p.isLoading && !p.registers.length}
      isError={p.isError}
      onRetry={p.refetch}
    >
      <section className="rst-integrations">
        <div className="rst-halls__toolbar">
          <div>
            <h1 className="rst-coming__title">{p.t('rst.integrations.title')}</h1>
            <p className="rst-coming__text mb-0">{p.t('rst.integrations.subtitle')}</p>
          </div>
        </div>

        <div className="rst-integrations__grid">
          <RestaurantTaxSettingsPanel
            cashRegisterId={p.cashRegisterId}
            registers={p.registers}
            registersLoading={p.registersLoading}
            registersError={p.registersError}
            onSelectRegister={p.setCashRegisterId}
            onCreateRegister={p.createRegister}
            creatingRegister={p.creatingRegister}
            t={p.t}
          />
        </div>
      </section>
    </AdminWorkspaceGate>
  );
}
